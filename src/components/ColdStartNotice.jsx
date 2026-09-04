import { Loader2 } from 'lucide-react'

/**
 * "Backend dang ngu, doi mot chut" — chu khong de nguoi ta doan.
 *
 * <p>Truoc day thong bao nay chi co o man vi. Nhung cho nguoi la cham vao dau
 * tien la <b>man dang nhap</b>, va do cung la request dau tien danh thuc server.
 * Ho bam "Dang nhap", khong thay gi trong 75 giay, roi ket luan trang hong.
 *
 * <p>Nguong 4 giay: goi luc backend da thuc mat chua toi 1 giay, nen qua 4 giay
 * gan nhu chac chan la dang ngu day chu khong phai mang cham. Hien som hon thi
 * moi lan dang nhap binh thuong cung nhap nhay mot dong chu khong can thiet.
 *
 * <p>`role="status"` chu khong phai `role="alert"`: day la tin bao tien do, no
 * duoc phep cho toi luc nguoi dung ranh tai. `alert` cat ngang moi thu trinh
 * doc man hinh dang doc — dung no cho mot dong "dang cho" la lam phien.
 */
export default function ColdStartNotice({ seconds }) {
  return (
    <div
      role="status"
      className="mb-4 flex gap-3 rounded-xl border border-amber-300/60 bg-amber-50 p-3.5 text-sm text-amber-900"
    >
      <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin" aria-hidden="true" />
      <p className="m-0">
        Máy chủ đang khởi động — đã chờ {seconds}s. Nó chạy trên gói miễn phí, tự tắt sau 15 phút
        không ai dùng và mất khoảng một phút để dậy. <strong>Đang chờ, không phải lỗi.</strong>
      </p>
    </div>
  )
}
