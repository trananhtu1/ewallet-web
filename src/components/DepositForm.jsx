import clsx from 'clsx'
import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowDownToLine } from 'lucide-react'
import { groupFieldErrors } from '../lib/api'
import { formatMoney, validateAmount } from '../lib/money'
import { useDepositMutation } from '../store/walletApi'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'

export default function DepositForm({ walletId }) {
  const [amount, setAmount] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)

  // `busy` khong con la useState tu quan: RTK Query da theo doi san vong doi
  // cua mutation. Bot mot state, va bot mot cho co the quen setBusy(false).
  const [deposit, { isLoading: busy }] = useDepositMutation()

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
    try {
      // .unwrap() de loi nem ra nhu mot exception thuong. Khong co no thi
      // mutation tra ve { error } va cai catch duoi day khong bao gio chay.
      await deposit({ walletId, amount }).unwrap()
      setAmount('')
      toast.success(`Đã nạp ${formatMoney(amount)}`)
    } catch (error) {
      // Re nhanh theo CODE, khong theo message.
      if (error.code === 'VALIDATION_FAILED') setFieldErrors(groupFieldErrors(error.fieldErrors))
      else if (error.code === 'WALLET_NOT_FOUND') setFormError('Không tìm thấy ví này')
      else setFormError(error.message)
    }
  }

  return (
    // `h-full` + `flex` o day, va `mt-auto` o nut duoi: hai the nam canh nhau
    // trong mot luoi 2 cot, ma the Chuyen tien co ba truong con the nay co mot.
    // Khong ep chieu cao thi the trai lung lung mot khoang trong o duoi va hai
    // nut khong thang hang - de thay ngay khi mo trinh duyet.
    <Card className="h-full">
      <CardContent className="flex h-full flex-col pt-6">
        <h2 className="mb-4 text-[15px] font-semibold">Nạp tiền</h2>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="deposit-amount">Số tiền</Label>
            <Input
              id="deposit-amount"
              className={clsx(fieldErrors.amount && 'border-destructive')}
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
            <span aria-live="polite">
              {fieldErrors.amount?.map((message) => (
                <span key={message} className="text-sm text-destructive">{message}</span>
              ))}
            </span>
          </div>

          {/* Vung nay ton tai san du chua co loi (xem ghi chu aria-live tren),
              nhung `empty:hidden` tat khoang trong khi no rong - de tran thi
              trang co mot mang trang khong ai giai thich duoc. */}
          <p className="mt-3 mb-0 text-sm font-medium text-destructive empty:hidden" aria-live="polite">
            {formError}
          </p>

      {/* button--primary, giong het TransferForm. Hai the nam canh nhau, moi
          the mot hanh dong chinh cua rieng no - de mot cai la nut phu thi nguoi
          dung doc ra "cai nay kem quan trong hon", tham chi "cai nay dang bi
          khoa". Do la thu bat duoc bang mat khi mo trinh duyet lan dau. */}
          <Button type="submit" className="mt-auto w-full" disabled={busy}>
            <ArrowDownToLine className="size-4" aria-hidden="true" />
            {busy ? 'Đang nạp…' : 'Nạp tiền'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
