import clsx from 'clsx'
import { useState } from 'react'
import { groupFieldErrors, transfer } from '../lib/api'
import { validateAmount } from '../lib/money'

export default function TransferForm({ walletId, onDone }) {
  const [toWalletId, setToWalletId] = useState('')
  const [amount, setAmount] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError(null)

    const errors = {}
    if (!/^\d+$/.test(toWalletId.trim())) errors.toWalletId = ['Nhập số ID của ví đích']
    else if (Number(toWalletId) === walletId) errors.toWalletId = ['Không thể tự chuyển cho mình']

    const amountError = validateAmount(amount)
    if (amountError) errors.amount = [amountError]

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setBusy(true)
    try {
      // Response la VI NGUON sau khi chuyen - dung so du moi luon.
      const wallet = await transfer(walletId, toWalletId, amount)
      setToWalletId('')
      setAmount('')
      onDone(wallet)
    } catch (error) {
      // Ba nhanh nay la ly do backend tach `code` khoi `message`.
      if (error.code === 'INSUFFICIENT_FUNDS') {
        // KHONG phai loi nhap lieu - so tien go dung hoan toan, chi la khong du.
        // Nen bao o muc FORM chu khong dat duoi o input.
        setFormError('Số dư không đủ. Nạp thêm rồi thử lại.')
      } else if (error.code === 'SAME_WALLET') {
        setFieldErrors({ toWalletId: ['Không thể tự chuyển cho mình'] })
      } else if (error.code === 'WALLET_NOT_FOUND') {
        setFieldErrors({ toWalletId: ['Không tìm thấy ví này'] })
      } else if (error.code === 'VALIDATION_FAILED') {
        setFieldErrors(groupFieldErrors(error.fieldErrors))
      } else {
        setFormError(error.message)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Chuyển tiền</h2>

      <label className="field">
        <span className="label">Ví đích</span>
        <input
          className={clsx('input', fieldErrors.toWalletId && 'input--error')}
          value={toWalletId}
          onChange={(e) => setToWalletId(e.target.value)}
          placeholder="2"
          inputMode="numeric"
          disabled={busy}
        />
        {fieldErrors.toWalletId?.map((message) => (
          <span key={message} className="error">{message}</span>
        ))}
      </label>

      <label className="field">
        <span className="label">Số tiền</span>
        <input
          className={clsx('input', fieldErrors.amount && 'input--error')}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="30000.00"
          inputMode="decimal"
          disabled={busy}
        />
        {fieldErrors.amount?.map((message) => (
          <span key={message} className="error">{message}</span>
        ))}
      </label>

      {formError && <p className="error error--form">{formError}</p>}

      <button className="button button--primary" disabled={busy}>
        {busy ? 'Đang chuyển…' : 'Chuyển tiền'}
      </button>
    </form>
  )
}
