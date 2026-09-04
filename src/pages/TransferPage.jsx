import TransferForm from '../components/TransferForm'
import { useAuth } from '../auth/useAuth'

export default function TransferPage() {
  const { session } = useAuth()

  return (
    <>
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Chuyển tiền</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Nhập mã ví đích, hoặc chọn từ danh sách người nhận đã lưu.
      </p>

      <TransferForm walletId={session.walletId} />
    </>
  )
}
