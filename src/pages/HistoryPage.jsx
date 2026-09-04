import { useState } from 'react'
import { useAuth } from '../auth/useAuth'
import TransactionFilters from '../components/TransactionFilters'
import TransactionList from '../components/TransactionList'
import { Button } from '../components/ui/button'
import { useGetTransactionsQuery } from '../store/walletApi'

/**
 * Lich su day du: bo loc + phan trang cursor.
 *
 * <p>Tach khoi trang chu vi day la noi nguoi dung <b>di tim</b> mot thu, con
 * trang chu la noi ho <b>liec qua</b>. Hai muc dich khac nhau thi hai man hinh.
 */
export default function HistoryPage() {
  const { session } = useAuth()
  const walletId = session.walletId

  // cursor = moc cua trang dang xin. null = trang dau.
  const [cursor, setCursor] = useState(null)

  const [boLoc, setBoLoc] = useState({
    type: '', direction: '', status: '', fromDate: '', toDate: '',
  })

  // ⚠️ Doi bo loc thi PHAI dat lai cursor. Khong lam thi trang 2 cua bo loc CU
  // duoc xin voi bo loc MOI - con tro tro vao mot dong khong con nam trong tap
  // ket qua nua. Hai trang thai nay luon doi cung nhau nen di qua dung mot ham.
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
    // <input type="date"> cho ra 'YYYY-MM-DD', backend doi ISO-8601 day du.
    // Lay 00:00 va 23:59:59 THEO GIO MAY NGUOI DUNG roi de toISOString() doi
    // sang UTC - khong ghep chuoi 'T00:00:00Z' bang tay, vi lam vay la ep moc
    // thoi gian ve UTC va nguoi o UTC+7 mat 7 gio dau cua ngay ho chon.
    from: boLoc.fromDate ? new Date(`${boLoc.fromDate}T00:00:00`).toISOString() : '',
    to: boLoc.toDate ? new Date(`${boLoc.toDate}T23:59:59.999`).toISOString() : '',
  })

  // isLoading chi TRUE o lan tai dau tien. Bam "Xem them" thi no van FALSE va
  // isFetching moi len TRUE - dung cai ta can, vi danh sach cu phai o nguyen
  // tren man hinh trong luc trang sau dang ve.
  const dangTaiThem = txQuery.isFetching && !txQuery.isLoading
  const loadError = txQuery.error?.status === 401 ? null : txQuery.error

  return (
    <>
      <h1 className="mb-5 text-xl font-semibold tracking-tight">Lịch sử giao dịch</h1>

      <TransactionFilters value={boLoc} onChange={doiBoLoc} disabled={txQuery.isLoading} />

      <section className="rounded-2xl border border-border bg-card p-5">
        <TransactionList
          transactions={txQuery.data?.items ?? []}
          loading={txQuery.isLoading}
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
    </>
  )
}
