import { formatMoney } from '../lib/money'
import { Skeleton } from './ui/skeleton'

/**
 * So du la thu nguoi dung mo app len de xem, nen no to nhat man hinh.
 *
 * <p>Nen dam chu khong phai the trang nhu cac khoi khac: man nay co bon khoi
 * (so du, nap, chuyen, lich su) va truoc day ca bon cung mot trong so thi giac
 * - mat khong biet nhin dau truoc. Doi mot khoi sang nen dam la cach re nhat de
 * noi "cai nay truoc".
 *
 * <p>`version` co trong response nhung KHONG hien: no la chi tiet noi bo cua
 * optimistic locking, nguoi dung khong can biet va cung khong nen thay.
 *
 * <p>💰 KHONG BIET so du KHONG PHAI la so du bang 0. Ban truoc trang nay nhan
 * `wallet ?? {}`, nen luc backend chet `wallet.balance` la undefined,
 * formatMoney doi no thanh chuoi '0' va man hinh in ra "0,00 d" to dung giua -
 * mot loi noi doi ve tien, va noi rat tu tin. Do that: tat backend roi tai lai
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
    <section className="mb-4 overflow-hidden rounded-2xl bg-[#0d1524] p-6 text-white sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <p className="m-0 text-sm text-white/60">Số dư khả dụng</p>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/70">
          Ví #{wallet?.id ?? '—'}
        </span>
      </div>

      {loading ? (
        <Skeleton className="mt-3 h-10 w-56 bg-white/15" />
      ) : (
        <p
          className="mt-2 mb-0 text-4xl font-semibold tracking-tight sm:text-[42px]"
          // Chu so deu be ngang -> so du khong nhay ngang khi doi gia tri.
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {unknown ? '—' : formatMoney(wallet.balance)}
        </p>
      )}
    </section>
  )
}
