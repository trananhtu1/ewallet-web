import { useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import DepositForm from '../components/DepositForm'
import TransactionList from '../components/TransactionList'
import TransferForm from '../components/TransferForm'
import WalletCard from '../components/WalletCard'
import { useGetTransactionsQuery, useGetWalletQuery } from '../store/walletApi'

// Cho qua bay nhieu giay thi gan nhu chac chan backend dang ngu day chu khong
// phai mang cham: goi luc backend da thuc chi mat chua toi 1 giay.
// Render free cho service ngu sau 15 phut khong co traffic, day lai mat ~1 phut.
const WAKE_HINT_AFTER_SECONDS = 4

export default function WalletPage() {
  // Vi den tu AuthResponse chu khong con la so 1 doan bua. RequireAuth dam bao
  // session ton tai truoc khi trang nay duoc render.
  const { session, signOut } = useAuth()
  const walletId = session.walletId

  // Hai query doc lap nhau -> RTK Query ban song song, khong xep hang.
  //
  // Bien mat so voi ban truoc: useEffect, AbortController, ba state
  // (wallet/transactions/loadError) va ca ham reload(). RTK Query lo het -
  // ke ca chuyen huy request luc unmount va bo qua ket qua ve muon.
  const walletQuery = useGetWalletQuery(walletId)
  const txQuery = useGetTransactionsQuery({ walletId, limit: 20 })

  const loading = walletQuery.isLoading || txQuery.isLoading

  // 401 KHONG hien ra o day: interceptor da goi sessionExpired -> phien bi xoa
  // -> RequireAuth day ve /login. Bao loi cho mot man sap bien mat la lam
  // nguoi dung hoang vi mot chuyen da duoc xu ly.
  const rawError = walletQuery.error ?? txQuery.error
  const loadError = rawError?.status === 401 ? null : rawError

  const [elapsed, setElapsed] = useState(0)

  // Dong ho chi chay trong luc con dang cho lan dau.
  useEffect(() => {
    if (!loading) return

    const startedAt = Date.now()
    // Tinh bang HIEU cua Date.now(), khong cong don mot bien dem: trinh duyet
    // ha tan suat setInterval khi tab chay nen, cong don se ra so sai bet.
    const timer = setInterval(() => setElapsed(Math.round((Date.now() - startedAt) / 1000)), 500)
    return () => clearInterval(timer)
  }, [loading])

  const isWaking = loading && elapsed >= WAKE_HINT_AFTER_SECONDS

  return (
    <div className="page">
      <header className="header">
        <div className="header__bar">
          <div>
            <h1>Ví điện tử</h1>
            <p className="muted">{session.fullName} · Ví #{walletId}</p>
          </div>

          <button type="button" className="button button--ghost" onClick={signOut}>
            Đăng xuất
          </button>
        </div>
      </header>

      {/* role="status" chu khong phai role="alert": day la tin bao tien do, no
          duoc phep cho toi luc nguoi dung ranh tai. alert cat ngang moi thu
          nguoi dung dang nghe, va dung no cho mot dong "dang cho" la lam phien. */}
      {isWaking && (
        <p className="notice" role="status">
          Backend đang khởi động — đã chờ {elapsed}s. Nó chạy trên gói miễn phí của Render,
          tự tắt sau 15 phút không ai dùng và mất khoảng một phút để dậy lại. Trang đang chờ,
          không phải lỗi.
        </p>
      )}

      {/* Cai nay thi role="alert": trang dang hien so lieu KHONG dung, nguoi dung
          phai biet ngay chu khong doi. */}
      {loadError && (
        <p className="notice notice--error" role="alert">
          {loadError.code === 'WALLET_NOT_FOUND'
            ? `Không tìm thấy ví #${walletId}.`
            : loadError.message}
        </p>
      )}

      {/* Truyen thang `data`, KHONG phai `data ?? {}`. Cai `?? {}` cu bien
          "chua biet so du" thanh "so du bang 0" ngay tai day. */}
      <WalletCard wallet={walletQuery.data} loading={loading} />

      <div className="form-grid">
        {/* Khong con onDone: nap/chuyen xong, RTK Query tu ghi vi moi vao cache
            va tu goi lai lich su giao dich - xem invalidatesTags trong
            walletApi.js. Truoc day WalletPage phai tu lam ca hai viec do. */}
        <DepositForm walletId={walletId} />
        <TransferForm walletId={walletId} />
      </div>

      <section className="card">
        <h2>Lịch sử giao dịch</h2>
        <TransactionList
          transactions={txQuery.data ?? []}
          loading={loading}
          unavailable={Boolean(loadError)}
        />
      </section>
    </div>
  )
}
