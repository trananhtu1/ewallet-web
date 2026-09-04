import { Wallet } from 'lucide-react'

/**
 * Nhan dien san pham: mot dau hieu + mot cai ten.
 *
 * <p>Truoc day app khong co gi ca - man dang nhap la mot the trang troi giua
 * nen xam, khong noi day la cai gi. Voi mot duong link nam trong CV thi do la
 * cho mat nguoi xem nhanh nhat: ho mo ra, khong biet dang nhin cai gi, dong lai.
 *
 * <p>Khong dung anh: mot the <svg> tu lucide nhe hon moi file png, sac net o
 * moi do phan giai, va doi mau theo currentColor nen dung duoc ca tren nen sang
 * lan nen dam ma khong can hai phien ban.
 */
export default function Brand({ size = 'md', className = '' }) {
  const lon = size === 'lg'

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span
        className={`grid place-items-center rounded-xl bg-primary text-primary-foreground ${
          lon ? 'size-11' : 'size-9'
        }`}
        // Dau hieu nay khong mang thong tin nao ma cai ten ben canh chua noi.
        // De trinh doc man hinh doc ca hai la bat nguoi dung nghe mot thu thua.
        aria-hidden="true"
      >
        <Wallet className={lon ? 'size-6' : 'size-5'} strokeWidth={2.2} />
      </span>

      <span className={`font-semibold tracking-tight ${lon ? 'text-xl' : 'text-base'}`}>
        Ví điện tử
      </span>
    </div>
  )
}
