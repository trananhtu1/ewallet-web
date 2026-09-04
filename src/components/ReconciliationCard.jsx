import { CircleAlert, CircleCheck, Scale } from 'lucide-react'
import { formatMoney } from '../lib/money'
import { useGetReconciliationQuery } from '../store/walletApi'
import { Card, CardContent } from './ui/card'

/**
 * Doi soat cuoi ngay - he thong tu kiem tra chinh minh.
 *
 * <p>⭐ Job nay chay theo lich tu 29/08 va <b>chua he co cho nao xem ket qua</b>.
 * No cong tong so du cua moi vi, cong tong so cai, roi so hai con so.
 *
 * <p>Hai con so PHAI bang nhau: moi dong tien vao he thong deu di qua so cai.
 * Lech mot dong nao la co gi do ghi vao vi ma khong ghi vao so - va do la loai
 * loi khong bao gio tu lo ra, vi tung giao dich rieng le van trong binh thuong.
 *
 * <p>📌 Day la thu hiem thay trong mot project ca nhan, va la thu ngan hang
 * lam moi ngay. Trang thai DRIFT hien ra khong phai loi cua man hinh - no la
 * job dang lam dung viec.
 */
export default function ReconciliationCard() {
  const { data: lanChay, isLoading } = useGetReconciliationQuery(5)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Đang tải đối soát…</p>
        </CardContent>
      </Card>
    )
  }

  if (!lanChay?.length) return null

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-1 flex items-center gap-2">
          <Scale className="size-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-[15px] font-semibold">Đối soát cuối ngày</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Mỗi ngày hệ thống cộng tổng số dư mọi ví và tổng sổ cái rồi so hai con số. Lệch một
          đồng nghĩa là có gì đó vào ví mà không vào sổ.
        </p>

        <ul className="m-0 list-none p-0">
          {lanChay.map((r) => {
            const khop = r.status === 'OK'
            const Icon = khop ? CircleCheck : CircleAlert

            return (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border py-3 last:border-0 last:pb-0"
              >
                <Icon
                  className={`size-4 shrink-0 ${khop ? 'text-emerald-600' : 'text-amber-600'}`}
                  aria-hidden="true"
                />

                <span className="text-sm font-medium">{r.businessDate}</span>

                <span
                  className={
                    'rounded-full px-2 py-0.5 text-[11px] ' +
                    (khop ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800')
                  }
                >
                  {khop ? 'Khớp' : 'Lệch'}
                </span>

                <span className="ml-auto text-xs text-muted-foreground">{r.durationMs} ms</span>

                <div
                  className="w-full text-xs text-muted-foreground"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  Ví {formatMoney(r.walletTotal)} · Sổ cái {formatMoney(r.ledgerTotal)}
                  {!khop && (
                    <>
                      {' · '}
                      <span className="font-medium text-amber-700">
                        lệch {formatMoney(r.drift)}
                      </span>
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
