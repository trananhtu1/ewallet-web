import clsx from 'clsx'
import { useState } from 'react'
import { deposit, groupFieldErrors } from '../lib/api'
import { validateAmount } from '../lib/money'

export default function DepositForm({ walletId, onDone }) {
  const [amount, setAmount] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError(null)

    // Kiem o client de bao loi ngay, khong ton mot vong goi mang.
    // Backend van kiem lai - do moi la thu quyet dinh.
    const localError = validateAmount(amount)
    if (localError) {
      setFieldErrors({ amount: [localError] })
      return
    }

    setFieldErrors({})
    setBusy(true)
    try {
      // Response CHINH LA vi sau khi nap -> khong can goi lai GET /api/wallets/{id}.
      const wallet = await deposit(walletId, amount)
      setAmount('')
      onDone(wallet)
    } catch (error) {
      // Re nhanh theo CODE, khong theo message.
      if (error.code === 'VALIDATION_FAILED') setFieldErrors(groupFieldErrors(error.fieldErrors))
      else if (error.code === 'WALLET_NOT_FOUND') setFormError('Không tìm thấy ví này')
      else setFormError(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Nạp tiền</h2>

      <label className="field">
        <span className="label">Số tiền</span>
        <input
          className={clsx('input', fieldErrors.amount && 'input--error')}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="50000.00"
          inputMode="decimal"
          disabled={busy}
        />
        {fieldErrors.amount?.map((message) => (
          <span key={message} className="error">{message}</span>
        ))}
      </label>

      {formError && <p className="error error--form">{formError}</p>}

      <button className="button" disabled={busy}>
        {busy ? 'Đang nạp…' : 'Nạp tiền'}
      </button>
    </form>
  )
}
