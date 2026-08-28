import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import DepositForm from '../components/DepositForm'
import TransactionList from '../components/TransactionList'
import TransferForm from '../components/TransferForm'
import WalletCard from '../components/WalletCard'
import { getTransactions, getWallet } from '../lib/api'

// Cho qua bay nhieu giay thi gan nhu chac chan backend dang ngu day chu khong
// phai mang cham: goi luc backend da thuc chi mat chua toi 1 giay.
// Render free cho service ngu sau 15 phut khong co traffic, day lai mat ~1 phut.
const WAKE_HINT_AFTER_SECONDS = 4

export default function WalletPage() {
  // Vi den tu AuthResponse chu khong con la so 1 doan bua. RequireAuth dam bao
  // session ton tai truoc khi trang nay duoc render.
  const { session, signOut } = useAuth()
  const walletId = session.walletId

  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [elapsed, setElapsed] = useState(0)

  const reload = useCallback(
    async (signal) => {
      setLoadError(null)
      try {
        // Hai request doc lap nhau -> ban song song, khong xep hang.
        const [walletData, txData] = await Promise.all([
          getWallet(walletId, { signal }),
          getTransactions(walletId, 20, { signal }),
        ])
        setWallet(walletData)
        setTransactions(txData)
      } catch (error) {
        if (error.name === 'AbortError') return
        // Token het han thi api() da goi setSessionExpiredHandler -> phien bi
        // xoa -> RequireAuth day ve /login. Khong hien loi 401 o day lam gi.
        if (error.status === 401) return
        setLoadError(error)
      } finally {
        setLoading(false)
      }
    },
    [walletId],
  )

  useEffect(() => {
    // AbortController de huy request khi unmount. Thieu no, StrictMode goi
    // effect 2 lan o dev -> 2 request, va request cu ve muon co the ghi de
    // ket qua moi (race condition).
    const controller = new AbortController()
    reload(controller.signal)
    return () => controller.abort()
  }, [reload])

  // Dong ho chi chay trong luc con dang cho lan dau.
  useEffect(() => {
    if (!loading) return

    const startedAt = Date.now()
    // Tinh bang HIEU cua Date.now(), khong cong don mot bien dem: trinh duyet
    // ha tan suat setInterval khi tab chay nen, cong don se ra so sai bet.
    const timer = setInterval(() => setElapsed(Math.round((Date.now() - startedAt) / 1000)), 500)
    return () => clearInterval(timer)
  }, [loading])

  // Nap/chuyen tien xong: response DA LA vi moi -> dung luon, khong goi lai
  // GET /api/wallets/{id}. Nhung lich su thi phai lay lai vi co dong moi.
  function handleMoneyMoved(updatedWallet) {
    setWallet(updatedWallet)
    getTransactions(walletId, 20).then(setTransactions).catch(() => {})
  }

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

      {/* Truyen thang `wallet`, KHONG phai `wallet ?? {}`. Cai `?? {}` cu bien
          "chua biet so du" thanh "so du bang 0" ngay tai day. */}
      <WalletCard wallet={wallet} loading={loading} />

      <div className="form-grid">
        <DepositForm walletId={walletId} onDone={handleMoneyMoved} />
        <TransferForm walletId={walletId} onDone={handleMoneyMoved} />
      </div>

      <section className="card">
        <h2>Lịch sử giao dịch</h2>
        <TransactionList
          transactions={transactions}
          loading={loading}
          unavailable={Boolean(loadError)}
        />
      </section>
    </div>
  )
}
