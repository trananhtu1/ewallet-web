import { formatMoney } from '../lib/money'

/**
 * So du la thu nguoi dung mo app len de xem, nen no to nhat man hinh.
 *
 * `version` co trong response nhung KHONG hien: no la chi tiet noi bo cua
 * optimistic locking, nguoi dung khong can biet va cung khong nen thay.
 */
export default function WalletCard({ wallet, loading }) {
  return (
    <section className="card card--hero">
      <p className="label">Số dư khả dụng</p>

      {loading ? (
        <p className="balance balance--skeleton">&nbsp;</p>
      ) : (
        <p className="balance">{formatMoney(wallet.balance)}</p>
      )}

      <p className="muted">Ví #{wallet?.id ?? '—'}</p>
    </section>
  )
}
