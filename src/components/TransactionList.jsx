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

export default function TransactionList({ transactions, loading }) {
  if (loading) return <p className="muted">Đang tải lịch sử…</p>

  if (transactions.length === 0) {
    return <p className="muted">Chưa có giao dịch nào. Nạp tiền để bắt đầu.</p>
  }

  return (
    <ul className="tx-list">
      {transactions.map((tx) => (
        <li key={tx.id} className="tx">
          <div className="tx__main">
            <span className="tx__title">{describe(tx)}</span>
            <span className="tx__time">{formatTime(tx.createdAt)}</span>
          </div>

          <div className="tx__right">
            <span className={`tx__amount tx__amount--${tx.direction.toLowerCase()}`}>
              {signOf(tx.direction)} {formatMoney(tx.amount)}
            </span>
            {/* status FAILED backend chua bao gio tra ve (con no REQUIRES_NEW),
                nhung viet san nhanh nay de sau khoi phai sua lai. */}
            {tx.status === 'FAILED' && <span className="badge badge--failed">Thất bại</span>}
          </div>
        </li>
      ))}
    </ul>
  )
}
