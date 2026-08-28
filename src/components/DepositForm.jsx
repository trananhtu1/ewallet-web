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
          aria-invalid={Boolean(fieldErrors.amount)}
        />
        {/* aria-live tren VUNG CHUA, khong phai tren tung dong loi: vung phai
            ton tai san trong DOM tu truoc thi trinh doc man hinh moi nhan ra
            co gi vua them vao. Dat aria-live thang len phan tu vua duoc chen
            ra thi no thuong khong doc. */}
        <span className="field__errors" aria-live="polite">
          {fieldErrors.amount?.map((message) => (
            <span key={message} className="error">{message}</span>
          ))}
        </span>
      </label>

      <p className="error error--form" aria-live="polite">{formError}</p>

      {/* button--primary, giong het TransferForm. Hai the nam canh nhau, moi
          the mot hanh dong chinh cua rieng no - de mot cai la nut phu thi nguoi
          dung doc ra "cai nay kem quan trong hon", tham chi "cai nay dang bi
          khoa". Do la thu bat duoc bang mat khi mo trinh duyet lan dau. */}
      <button className="button button--primary" disabled={busy}>
        {busy ? 'Đang nạp…' : 'Nạp tiền'}
      </button>
    </form>
  )
}
