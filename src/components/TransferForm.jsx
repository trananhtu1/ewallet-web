import clsx from 'clsx'
import { useState } from 'react'
import { toast } from 'sonner'
import { SendHorizontal } from 'lucide-react'
import { groupFieldErrors } from '../lib/api'
import { formatMoney, validateAmount } from '../lib/money'
import { useTransferMutation } from '../store/walletApi'

export default function TransferForm({ walletId }) {
  const [toWalletId, setToWalletId] = useState('')
  const [amount, setAmount] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)

  const [transfer, { isLoading: busy }] = useTransferMutation()

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
    try {
      await transfer({ fromWalletId: walletId, toWalletId, amount }).unwrap()
      setToWalletId('')
      setAmount('')
      toast.success(`Đã chuyển ${formatMoney(amount)} tới ví #${toWalletId.trim()}`)
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
          aria-invalid={Boolean(fieldErrors.toWalletId)}
        />
        <span className="field__errors" aria-live="polite">
          {fieldErrors.toWalletId?.map((message) => (
            <span key={message} className="error">{message}</span>
          ))}
        </span>
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
          aria-invalid={Boolean(fieldErrors.amount)}
        />
        <span className="field__errors" aria-live="polite">
          {fieldErrors.amount?.map((message) => (
            <span key={message} className="error">{message}</span>
          ))}
        </span>
      </label>

      {/* INSUFFICIENT_FUNDS bao o day chu khong duoi o input, va no la loi
          nguoi dung can nghe nhat -> aria-live giu san vung nay tu dau. */}
      <p className="error error--form" aria-live="polite">{formError}</p>

      <button className="button button--primary" disabled={busy}>
        <SendHorizontal size={16} aria-hidden="true" />
        {busy ? 'Đang chuyển…' : 'Chuyển tiền'}
      </button>
    </form>
  )
}
