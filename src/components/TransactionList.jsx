import clsx from 'clsx'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'

import { formatMoney, signOf } from '../lib/money'

const TYPE_LABEL = {
  DEPOSIT: 'Nạp tiền',
  TRANSFER: 'Chuyển tiền',
}

function describe(tx) {
  if (tx.type === 'DEPOSIT') return TYPE_LABEL.DEPOSIT
  return tx.direction === 'IN' ? `Nhận từ ví #${tx.counterpartyWalletId}` : `Chuyển tới ví #${tx.counterpartyWalletId}`
}

function formatTime(iso) {
  // Backend luu TIMESTAMPTZ va tra ve UTC. Trinh duyet tu doi sang gio may nguoi dung.
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

export default function TransactionList({ transactions, loading, unavailable = false }) {
  if (loading) return <p className="text-sm text-muted-foreground">Đang tải lịch sử…</p>

  // Cung mot cai bay voi so du: KHONG lay duoc lich su khong phai la KHONG CO
  // giao dich nao. Ban truoc, tat backend roi tai lai trang thi vi da co 2 giao
  // dich van hien "Chua co giao dich nao. Nap tien de bat dau." - vua sai vua
  // xui nguoi dung nap them tien vao mot he thong dang hong.
  if (unavailable) {
    return <p className="text-sm text-muted-foreground">Không tải được lịch sử giao dịch.</p>
  }

  if (transactions.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Chưa có giao dịch nào. Nạp tiền để bắt đầu.
      </p>
    )
  }

  return (
    <ul className="m-0 list-none p-0">
      {transactions.map((tx) => {
        const vao = tx.direction === 'IN'

        return (
          <li
            key={tx.id}
            className="flex items-center gap-3 border-b border-border py-3 last:border-0 last:pb-0"
          >
            {/* ⭐ Mui ten mang dung thong tin ma dau +/- va mau chu da mang.
                Nhung MAU MOT MINH NO khong du: khoang 8% dan ong khong phan
                biet duoc do voi xanh la, va ho la nhom se doc dung dong so tien
                nay. Hinh dang mui ten thi ai cung thay.

                aria-hidden vi dau +/- ben canh da noi dieu do bang chu roi -
                de trinh doc man hinh doc ca hai la bat nguoi dung nghe mot thu
                thua. */}
            <span
              aria-hidden="true"
              className={clsx(
                'grid size-9 shrink-0 place-items-center rounded-full',
                vao ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700',
              )}
            >
              {vao ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
            </span>

            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm">{describe(tx)}</span>
              <span className="text-xs text-muted-foreground">{formatTime(tx.createdAt)}</span>
            </div>

            <div className="ml-auto flex items-center gap-2 whitespace-nowrap">
              <span
                className={clsx('text-sm font-semibold', vao ? 'text-emerald-700' : 'text-orange-700')}
                // Chu so deu be ngang -> cot tien thang hang giua cac dong.
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {signOf(tx.direction)} {formatMoney(tx.amount)}
              </span>

              {/* status FAILED backend chua bao gio tra ve (con no REQUIRES_NEW),
                  nhung viet san nhanh nay de sau khoi phai sua lai. */}
              {tx.status === 'FAILED' && (
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] text-destructive">
                  Thất bại
                </span>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
