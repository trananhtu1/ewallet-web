import { formatMoney } from '../lib/money'

/**
 * So du la thu nguoi dung mo app len de xem, nen no to nhat man hinh.
 *
 * `version` co trong response nhung KHONG hien: no la chi tiet noi bo cua
 * optimistic locking, nguoi dung khong can biet va cung khong nen thay.
 *
 * <p>💰 KHONG BIET so du KHONG PHAI la so du bang 0. Ban truoc trang nay nhan
 * `wallet ?? {}`, nen luc backend chet `wallet.balance` la undefined,
 * formatMoney doi no thanh chuoi '0' va man hinh in ra "0,00 d" to dung giua -
 * mot lo'i noi doi ve tien, va noi rat tu tin. Do that: tat backend roi tai lai
 * trang, so du hien 0,00 d trong khi vi that co 37.654,33 d.
 *
 * <p>Man trang con de nhan ra hon: nguoi dung biet la hong. Mot con so 0 sai
 * thi khong ai biet, va no la con so dau tien ho nhin thay khi mo app.
 */
export default function WalletCard({ wallet, loading }) {
  // == null bat CA null lan undefined, va chi hai cai do. Khong dung !wallet.balance:
  // chuoi "0.00" la so du that su bang khong va no PHAI hien ra 0,00 d.
  const unknown = wallet?.balance == null

  return (
    <section className="card card--hero">
      <p className="label">Số dư khả dụng</p>

      {loading ? (
        <p className="balance balance--skeleton">&nbsp;</p>
      ) : (
        <p className="balance">{unknown ? '—' : formatMoney(wallet.balance)}</p>
      )}

      <p className="muted">Ví #{wallet?.id ?? '—'}</p>
    </section>
  )
}
