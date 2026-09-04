import { formatMoney } from '../lib/money'
import { Card, CardContent } from '../components/ui/card'
import { useGetStatementQuery } from '../store/walletApi'

/**
 * Sao ke: thu/chi theo thang.
 *
 * <p>⭐ Moi con so o day do <b>database</b> cong, khong phai trinh duyet. Cach
 * nguoc lai - tai het giao dich ve roi cong o JavaScript - hong ba mat: chuyen
 * ca nghin dong qua mang de hien sau con so, cong tien bang {@code double}, va
 * <b>sai ngay khi co phan trang</b> vi client chi cong duoc trang dang cam.
 *
 * <p>Thanh do dai ty le tuong doi, khong phai bieu do that: chi can tra loi
 * "thang nao tieu nhieu hon thang nao" bang mot cai liec, va mot thu vien bieu
 * do cho viec do la 40 kB gzip cho mot cau hoi ma hai the div tra loi duoc.
 */
export default function StatementPage() {
  const { data: thang, isLoading } = useGetStatementQuery(6)

  // Moc de chia ty le: thang tieu/nhan nhieu nhat trong ky.
  const lonNhat = Math.max(
    1,
    ...(thang ?? []).flatMap((m) => [Number(m.moneyIn), Number(m.moneyOut)]),
  )

  return (
    <>
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Sao kê</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Tổng tiền vào và ra theo từng tháng. Chỉ tính giao dịch thành công.
      </p>

      {isLoading && <p className="text-sm text-muted-foreground">Đang tải…</p>}

      {!isLoading && !thang?.length && (
        <Card>
          <CardContent className="pt-6">
            <p className="m-0 py-4 text-center text-sm text-muted-foreground">
              Chưa có giao dịch nào để lập sao kê.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {thang?.map((m) => {
          const vao = Number(m.moneyIn)
          const ra = Number(m.moneyOut)
          const duong = Number(m.net) >= 0

          return (
            <Card key={m.month}>
              <CardContent className="pt-6">
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-[15px] font-semibold">{m.month}</h2>
                  <span className="text-xs text-muted-foreground">{m.count} giao dịch</span>
                </div>

                <div className="grid gap-3">
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-muted-foreground">Tiền vào</span>
                      <span
                        className="font-medium text-emerald-700"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {formatMoney(m.moneyIn)}
                      </span>
                    </div>
                    {/* aria-hidden: con so ngay tren da noi het, thanh nay chi de liec. */}
                    <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${(vao / lonNhat) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-muted-foreground">Tiền ra</span>
                      <span
                        className="font-medium text-orange-700"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {formatMoney(m.moneyOut)}
                      </span>
                    </div>
                    <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-orange-500"
                        style={{ width: `${(ra / lonNhat) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-between border-t border-border pt-3 text-sm">
                  <span className="text-muted-foreground">Chênh lệch</span>
                  <span
                    className={`font-semibold ${duong ? 'text-emerald-700' : 'text-orange-700'}`}
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {duong ? '+' : '−'} {formatMoney(m.net.replace('-', ''))}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}
