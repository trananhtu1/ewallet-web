import { useState } from 'react'
import { useAuth } from '../auth/useAuth'
import BeneficiaryPicker from '../components/BeneficiaryPicker'
import ReceiveQr from '../components/ReceiveQr'
import TransferForm from '../components/TransferForm'

export default function TransferPage() {
  const { session } = useAuth()

  // ⭐ State nay song o DAY chu khong trong TransferForm: so dia chi nguoi nhan
  // la mot thanh phan ANH EM cua form, va hai anh em khong noi chuyen truc tiep
  // duoc. Trang la to tien chung gan nhat, nen no giu.
  const [toWalletId, setToWalletId] = useState('')

  return (
    <>
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Chuyển tiền</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Nhập mã ví đích, hoặc chọn từ danh sách người nhận đã lưu.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <TransferForm
          walletId={session.walletId}
          toWalletId={toWalletId}
          setToWalletId={setToWalletId}
        />

        <div className="grid gap-4">
          <BeneficiaryPicker onPick={setToWalletId} />
          <ReceiveQr />
        </div>
      </div>
    </>
  )
}
