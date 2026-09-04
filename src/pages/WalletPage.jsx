import { LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import Brand from '../components/Brand'
import ColdStartNotice from '../components/ColdStartNotice'
import KycCard from '../components/KycCard'
import ReconciliationCard from '../components/ReconciliationCard'
import TransactionFilters from '../components/TransactionFilters'
import { Button } from '../components/ui/button'
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

  // cursor = moc cua trang dang xin. null = trang dau.
  // Giu o day chu khong trong walletApi: day la trang thai cua MAN HINH (nguoi
  // dung da bam Xem them may lan), khong phai cua du lieu.
  const [cursor, setCursor] = useState(null)

  const [boLoc, setBoLoc] = useState({
    type: '', direction: '', status: '', fromDate: '', toDate: '',
  })

  // ⚠️ Doi bo loc thi PHAI dat lai cursor. Khong lam thi trang 2 cua bo loc CU
  // duoc xin voi bo loc MOI - con tro tro vao mot dong khong con nam trong tap
  // ket qua nua, va backend tra ve mot khoang giua chung. Hai trang thai nay
  // luon doi cung nhau, nen chung di qua dung mot ham.
  const doiBoLoc = (moi) => {
    setBoLoc(moi)
    setCursor(null)
  }

  const txQuery = useGetTransactionsQuery({
    walletId,
    limit: 20,
    cursor,
    type: boLoc.type,
    direction: boLoc.direction,
    status: boLoc.status,
    // <input type="date"> cho ra 'YYYY-MM-DD', con backend doi ISO-8601 day du
    // (@DateTimeFormat ISO.DATE_TIME). Gui thieu phan gio thi 400.
    //
    // Lay 00:00 va 23:59:59 THEO GIO MAY NGUOI DUNG roi de toISOString() doi
    // sang UTC - khong ghep chuoi 'T00:00:00Z' bang tay, vi lam vay la ep moc
    // thoi gian ve UTC va nguoi o UTC+7 se mat 7 gio dau cua ngay ho chon.
    from: boLoc.fromDate ? new Date(`${boLoc.fromDate}T00:00:00`).toISOString() : '',
    to: boLoc.toDate ? new Date(`${boLoc.toDate}T23:59:59.999`).toISOString() : '',
  })

  // isLoading chi TRUE o lan tai dau tien cua mot o cache. Bam "Xem them" thi
  // no van FALSE va isFetching moi len TRUE - dung cai ta can, vi danh sach cu
  // phai o nguyen tren man hinh trong luc trang sau dang ve.
  const loading = walletQuery.isLoading || txQuery.isLoading
  const dangTaiThem = txQuery.isFetching && !txQuery.isLoading

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
    <div className="mx-auto max-w-[760px] px-5 pb-16 pt-6">
      <header className="mb-6 flex min-w-0 items-center justify-between gap-3">
        <Brand />

        <div className="flex min-w-0 items-center gap-3">
          {/* ⚠️ Ten chi duoc xuat hien MOT LAN trong DOM.
              Ban dau cho nay co hai the - mot cho man rong, mot cho man hep -
              va an nhau bang `hidden sm:inline` / `sm:hidden`. Nhung CSS chi
              GIAU, khong xoa khoi DOM: trinh doc man hinh doc ten hai lan, va
              test bat duoc ngay ("Found multiple elements with the text").

              An MOT the bang CSS thi khong sao - chi nhan ban no moi sai.

              ⚠️ Va o day an di la LUA CHON BO CUC, khong phai sua loi tran.
              Ban dau tuong trang bi tran ngang tren man 390px vi anh chup
              headless nhin nhu bi cat - do lai bang scrollWidth thi bang dung
              390, khong phan tu nao vuot. `truncate` + `min-w-0` da du.
              Van an vi header 390px co ba khoi thi chat, va ten nguoi dung la
              thu it can nhat trong ba. */}
          <span className="hidden truncate text-sm text-muted-foreground sm:inline">
            {session.fullName}
          </span>

          <Button type="button" variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="size-4" aria-hidden="true" />
            Đăng xuất
          </Button>
        </div>
      </header>

      {isWaking && <ColdStartNotice seconds={elapsed} />}

      {/* Cai nay thi role="alert": trang dang hien so lieu KHONG dung, nguoi dung
          phai biet ngay chu khong doi. */}
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

      {/* Truyen thang `data`, KHONG phai `data ?? {}`. Cai `?? {}` cu bien
          "chua biet so du" thanh "so du bang 0" ngay tai day. */}
      <WalletCard wallet={walletQuery.data} loading={loading} />

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Khong con onDone: nap/chuyen xong, RTK Query tu ghi vi moi vao cache
            va tu goi lai lich su giao dich - xem invalidatesTags trong
            walletApi.js. Truoc day WalletPage phai tu lam ca hai viec do. */}
        <DepositForm walletId={walletId} />
        <TransferForm walletId={walletId} />
      </div>

      <div className="mt-4 grid gap-4">
        <KycCard />
        <ReconciliationCard />
      </div>

      <section className="mt-4 rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-[15px] font-semibold">Lịch sử giao dịch</h2>

        <TransactionFilters value={boLoc} onChange={doiBoLoc} disabled={loading} />

        <TransactionList
          transactions={txQuery.data?.items ?? []}
          loading={loading}
          unavailable={Boolean(loadError)}
        />

        {txQuery.data?.hasMore && (
          <Button
            type="button"
            variant="outline"
            className="mt-4 w-full"
            disabled={dangTaiThem}
            onClick={() => setCursor(txQuery.data.nextCursor)}
          >
            {dangTaiThem ? 'Đang tải…' : 'Xem thêm'}
          </Button>
        )}
      </section>
    </div>
  )
}
