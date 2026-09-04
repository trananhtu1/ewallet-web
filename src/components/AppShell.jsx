import { ArrowLeftRight, ChartColumn, Home, List, User } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/useAuth'
import Brand from './Brand'

/**
 * Khung dieu huong bon tab.
 *
 * <p>⭐ Truoc day ca ung dung la MOT trang: so du, nap, chuyen, KYC, doi soat va
 * lich su chong len nhau theo chieu doc. Sau khi lo them ba tinh nang da co san
 * thi trang do dai gan hai man hinh, va khong con cho nao la "cho quan trong
 * nhat" nua.
 *
 * <p>Bon tab lay tu cach cac vi dien tu that sap xep: <b>trang chu chi giu so du,
 * vai hanh dong nhanh, va vai giao dich gan nhat</b> - moi thu khac day sang tab
 * rieng.
 *
 * <p>⚠️⚠️ <b>MOT the nav duy nhat, doi hinh dang bang CSS</b> - khong phai hai
 * the an nhau.
 *
 * <p>Ban dau file nay co HAI khoi dieu huong: mot cot doc {@code hidden lg:flex}
 * va mot thanh ngang {@code lg:hidden}. Nhin tren man hinh thi dung o ca hai kich
 * thuoc. Nhung CSS chi <b>giau</b>, khong xoa khoi DOM - nen trinh doc man hinh
 * gap <b>8 muc dieu huong</b> chu khong phai 4, va nguoi dung ban phim phai Tab
 * qua ca hai bo.
 *
 * <p>Test bat duoc ngay: <i>Found multiple elements with the role "link"</i>. Va
 * day la <b>lan thu hai</b> mac dung loi nay - lan dau la ten nguoi dung o header,
 * 04/09. Ghi chu canh bao da nam san trong file, va van lap lai.
 *
 * <p>Cach dung: mot the {@code <nav>}, {@code fixed bottom-0} tren man hep va
 * {@code lg:static} de no tro thanh cot dau tien cua luoi tren man rong. Mot DOM,
 * hai hinh dang.
 */

const TABS = [
  { to: '/', label: 'Trang chủ', Icon: Home, end: true },
  { to: '/chuyen-tien', label: 'Chuyển tiền', Icon: ArrowLeftRight },
  { to: '/lich-su', label: 'Lịch sử', Icon: List },
  { to: '/sao-ke', label: 'Sao kê', Icon: ChartColumn },
  { to: '/ca-nhan', label: 'Cá nhân', Icon: User },
]

export default function AppShell() {
  const { session } = useAuth()

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[232px_1fr]">
      {/* ===== MOT the nav duy nhat =====
          man hep: thanh ngang co dinh duoi day  ·  man rong: cot doc ben trai */}
      <nav
        aria-label="Điều hướng chính"
        className="
          fixed inset-x-0 bottom-0 z-10 grid grid-cols-5 border-t border-border bg-card
          lg:static lg:h-dvh lg:grid-cols-1 lg:content-start lg:gap-1 lg:border-r lg:border-t-0 lg:p-4
        "
      >
        {/* Nhan dien nam trong nav, va chi hien o dang cot: tren man hep no da
            co o header. Mot the, an bang CSS - khong nhan ban. */}
        <div className="hidden lg:mb-6 lg:block lg:px-2 lg:pt-2">
          <Brand />
        </div>

        {TABS.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              'flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors ' +
              'lg:flex-row lg:gap-3 lg:rounded-lg lg:px-3 lg:py-2 lg:text-sm ' +
              (isActive
                ? 'text-primary lg:bg-primary/10 lg:font-medium'
                : 'text-muted-foreground lg:hover:bg-accent')
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className="size-5 shrink-0 lg:size-4"
                  strokeWidth={isActive ? 2.4 : 2}
                  aria-hidden="true"
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ===== Noi dung ===== */}
      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-5 py-3">
          {/* Nhan dien o header chi cho man hep - man rong da co trong nav. */}
          <div className="lg:invisible">
            <Brand />
          </div>

          {/* Ten xuat hien DUNG MOT LAN trong ca cay DOM. */}
          <span className="truncate text-sm text-muted-foreground">{session.fullName}</span>
        </header>

        {/* pb-24 tren man hep: chua cho cho thanh tab noi ben duoi, neu khong no
            che mat dong cuoi cung cua noi dung. */}
        <main className="mx-auto w-full max-w-[760px] flex-1 px-5 pb-24 pt-5 lg:pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
