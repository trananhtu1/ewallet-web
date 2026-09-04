// ⚠️ KHONG import `Github`: lucide-react v1 da BO HET icon thuong hieu.
// No van import duoc (thanh `undefined`), va React chi vo luc RENDER voi thong
// bao "Element type is invalid" tro vao AuthLayout - khong tro vao dong import.
// Da mat mot vong chay test vi cho nay.
import { ExternalLink, ShieldCheck } from 'lucide-react'
import Brand from './Brand'

/**
 * Khung chung cho man dang nhap va dang ky: cot trai gioi thieu, cot phai la form.
 *
 * <p>Cot trai <b>bien mat tren dien thoai</b> (`hidden lg:flex`). No khong mang
 * chuc nang nao - ai vao day cung de dang nhap - nen tren man hep thi day form
 * xuong duoi mot man hinh gioi thieu la lam cham dung viec nguoi ta den de lam.
 *
 * <p>Ba dong o cot trai co y noi <b>ky thuat</b> chu khong noi loi ich nguoi
 * dung. Day la mot san pham trong ho so nang luc: nguoi mo link phan lon la
 * nguoi tuyen dung, va thu ho tim la cai gi da duoc xu ly, khong phai
 * "chuyen tien de dang".
 */
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[1fr_460px]">
      {/* ===== Cot trai: gioi thieu (an tren man hep) ===== */}
      <aside className="hidden lg:flex flex-col justify-between bg-[#0d1524] p-12 text-white">
        <Brand size="lg" className="text-white" />

        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Chuyển tiền giữa hai ví, và mọi thứ đi kèm khi đằng sau là tiền.
          </h2>

          <ul className="mt-8 space-y-4 text-[15px] text-white/70">
            <li className="flex gap-3">
              <ShieldCheck className="size-5 shrink-0 text-white/40" aria-hidden="true" />
              <span>
                Giao dịch <strong className="font-medium text-white">nguyên tử</strong> — trừ và
                cộng cùng thành công hoặc cùng huỷ.
              </span>
            </li>
            <li className="flex gap-3">
              <ShieldCheck className="size-5 shrink-0 text-white/40" aria-hidden="true" />
              <span>
                Khoá dòng theo thứ tự ID —{' '}
                <strong className="font-medium text-white">12 lệnh đồng thời, không deadlock</strong>.
              </span>
            </li>
            <li className="flex gap-3">
              <ShieldCheck className="size-5 shrink-0 text-white/40" aria-hidden="true" />
              <span>
                Bấm hai lần chỉ trừ một lần —{' '}
                <strong className="font-medium text-white">idempotency key</strong>.
              </span>
            </li>
          </ul>
        </div>

        <a
          href="https://github.com/trananhtu1/ewallet-api"
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-2 text-sm text-white/50 hover:text-white"
        >
          <ExternalLink className="size-4" aria-hidden="true" />
          Xem mã nguồn
        </a>
      </aside>

      {/* ===== Cot phai: form ===== */}
      <main className="flex min-h-dvh items-center justify-center px-5 py-10">
        <div className="w-full max-w-[380px]">
          {/* Nhan dien lap lai o day CHI cho man hep, vi luc do cot trai da an. */}
          <Brand className="mb-8 lg:hidden" />
          {children}
        </div>
      </main>
    </div>
  )
}
