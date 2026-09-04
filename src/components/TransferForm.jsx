import clsx from 'clsx'
import { useState } from 'react'
import { toast } from 'sonner'
import { SendHorizontal } from 'lucide-react'
import { groupFieldErrors } from '../lib/api'
import { formatMoney, validateAmount } from '../lib/money'
import { useTransferMutation } from '../store/walletApi'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'

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
    <Card className="h-full">
      <CardContent className="flex h-full flex-col pt-6">
        <h2 className="mb-4 text-[15px] font-semibold">Chuyển tiền</h2>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col" noValidate>
          <div className="mb-4 grid gap-2">
            <Label htmlFor="to-wallet">Ví đích</Label>
            <Input
              id="to-wallet"
              className={clsx(fieldErrors.toWalletId && 'border-destructive')}
              value={toWalletId}
              onChange={(e) => setToWalletId(e.target.value)}
              placeholder="2"
              inputMode="numeric"
              disabled={busy}
              aria-invalid={Boolean(fieldErrors.toWalletId)}
            />
            <span aria-live="polite">
              {fieldErrors.toWalletId?.map((message) => (
                <span key={message} className="text-sm text-destructive">{message}</span>
              ))}
            </span>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="transfer-amount">Số tiền</Label>
            <Input
              id="transfer-amount"
              className={clsx(fieldErrors.amount && 'border-destructive')}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="30000.00"
              inputMode="decimal"
              disabled={busy}
              aria-invalid={Boolean(fieldErrors.amount)}
            />
            <span aria-live="polite">
              {fieldErrors.amount?.map((message) => (
                <span key={message} className="text-sm text-destructive">{message}</span>
              ))}
            </span>
          </div>

          {/* INSUFFICIENT_FUNDS bao o day chu khong duoi o input, va no la loi
              nguoi dung can nghe nhat -> aria-live giu san vung nay tu dau.
              `empty:hidden` tat khoang trong khi chua co loi. */}
          <p className="mt-3 mb-0 text-sm font-medium text-destructive empty:hidden" aria-live="polite">
            {formError}
          </p>

          <Button type="submit" className="mt-auto w-full" disabled={busy}>
            <SendHorizontal className="size-4" aria-hidden="true" />
            {busy ? 'Đang chuyển…' : 'Chuyển tiền'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
