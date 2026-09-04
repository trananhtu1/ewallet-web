import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth'
import ColdStartNotice from '../components/ColdStartNotice'
import DepositForm from '../components/DepositForm'
import TransactionList from '../components/TransactionList'
import WalletCard from '../components/WalletCard'
import { Button } from '../components/ui/button'
import { useGetTransactionsQuery, useGetWalletQuery } from '../store/walletApi'

// Cho qua bay nhieu giay thi gan nhu chac chan backend dang ngu day.
const WAKE_HINT_AFTER_SECONDS = 4

/**
 * Trang chu - <b>chi ba thu</b>: so du, mot hanh dong nhanh, va vai giao dich gan nhat.
 *
 * <p>⭐ Day la cach cac vi dien tu that sap xep, va ly do khong phai tham my:
 * nguoi dung mo app len de <b>xem so du</b>. Moi thu them vao trang nay deu day
 * con so do xuong duoi va lam cham dung viec ho den de lam.
 *
 * <p>Chi lay <b>5</b> giao dich, khong phai 20: day khong phai man lich su. Ai
 * muon xem het thi co ca mot tab cho viec do, va co ca bo loc o day.
 */
export default function HomePage() {
  const { session } = useAuth()
  const walletId = session.walletId

  const walletQuery = useGetWalletQuery(walletId)
  const txQuery = useGetTransactionsQuery({ walletId, limit: 5 })

  const loading = walletQuery.isLoading || txQuery.isLoading

  // 401 KHONG hien ra o day: interceptor da goi sessionExpired -> phien bi xoa
  // -> RequireAuth day ve /login. Bao loi cho mot man sap bien mat la lam nguoi
  // dung hoang vi mot chuyen da duoc xu ly.
  const rawError = walletQuery.error ?? txQuery.error
  const loadError = rawError?.status === 401 ? null : rawError

  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!loading) return
    const startedAt = Date.now()
    // Tinh bang HIEU cua Date.now(), khong cong don: trinh duyet ha tan suat
    // setInterval khi tab chay nen, cong don se ra so sai bet.
    const timer = setInterval(() => setElapsed(Math.round((Date.now() - startedAt) / 1000)), 500)
    return () => clearInterval(timer)
  }, [loading])

  return (
    <>
      {loading && elapsed >= WAKE_HINT_AFTER_SECONDS && <ColdStartNotice seconds={elapsed} />}

      {loadError && (
        <p
          className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3.5 text-sm font-medium text-destructive"
          role="alert"
        >
          {loadError.code === 'WALLET_NOT_FOUND'
            ? `Không tìm thấy ví #${walletId}.`
            : loadError.message}
        </p>
      )}

      {/* Truyen thang `data`, KHONG phai `data ?? {}`. Cai `?? {}` bien "chua
          biet so du" thanh "so du bang 0" ngay tai day. */}
      <WalletCard wallet={walletQuery.data} loading={loading} />

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <DepositForm walletId={walletId} />

        {/* Khong nhung ca form chuyen tien vao trang chu: no co ba truong va mot
            so dia chi, du de la mot man rieng. O day chi la mot loi moi. */}
        <div className="flex flex-col justify-center rounded-xl border border-border bg-card p-5">
          <h2 className="mb-1 text-[15px] font-semibold">Chuyển tiền</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Gửi tới một ví khác, hoặc chọn từ danh sách người nhận đã lưu.
          </p>
          <Button asChild className="w-full">
            <Link to="/chuyen-tien">Chuyển tiền</Link>
          </Button>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold">Gần đây</h2>
          <Link to="/lich-su" className="text-sm font-medium text-primary hover:underline">
            Xem tất cả
          </Link>
        </div>

        <TransactionList
          transactions={txQuery.data?.items ?? []}
          loading={loading}
          unavailable={Boolean(loadError)}
        />
      </section>
    </>
  )
}
