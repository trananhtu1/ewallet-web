import { CheckCircle2, Clock, FileWarning, Upload } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useGetKycQuery, useSubmitKycMutation } from '../store/walletApi'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'

/**
 * Nop giay to xac minh danh tinh (KYC).
 *
 * <p>⭐ Hai endpoint nay backend co tu 29/08 va <b>chua he co giao dien nao goi</b>.
 * Ca mot tinh nang da xong, da co 9 integration test, va vo hinh voi nguoi dung.
 *
 * <p>Backend <b>khong giu anh</b>: no doc file, tinh kich thuoc va bam, luu
 * metadata vao JSONB roi vut anh di. Nen o day cung khong hien lai anh - khong
 * co gi de hien. Dieu do co y va noi ra duoc trong phong van: giu ban sao CCCD
 * cua nguoi dung la nhan mot trach nhiem phap ly ma mot project demo khong nen
 * nhan.
 */

const TRANG_THAI = {
  PENDING: { nhan: 'Đang chờ duyệt', Icon: Clock, lop: 'bg-amber-50 text-amber-800 border-amber-200' },
  APPROVED: { nhan: 'Đã duyệt', Icon: CheckCircle2, lop: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  REJECTED: { nhan: 'Bị từ chối', Icon: FileWarning, lop: 'bg-destructive/10 text-destructive border-destructive/30' },
}

export default function KycCard() {
  const { data: hoSo, isLoading } = useGetKycQuery()
  const [nop, { isLoading: dangNop }] = useSubmitKycMutation()

  const [truoc, setTruoc] = useState(null)
  const [sau, setSau] = useState(null)
  const [loi, setLoi] = useState(null)

  // Backend tra ve mang lich su nop. Cai moi nhat la cai dang co hieu luc.
  const hienTai = Array.isArray(hoSo) ? hoSo[0] : hoSo

  async function guiDi(event) {
    event.preventDefault()
    setLoi(null)

    if (!truoc || !sau) {
      setLoi('Chọn đủ ảnh mặt trước và mặt sau')
      return
    }

    // FormData chu khong phai JSON: hai file di kem, va backend nhan multipart.
    const fd = new FormData()
    fd.append('front', truoc)
    fd.append('back', sau)

    try {
      await nop(fd).unwrap()
      setTruoc(null)
      setSau(null)
      // Xoa gia tri trong <input type="file"> phai lam qua DOM - React khong
      // dieu khien duoc gia tri cua no vi ly do bao mat.
      event.target.reset()
      toast.success('Đã nộp hồ sơ, đang chờ duyệt')
    } catch (error) {
      if (error.code === 'KYC_ALREADY_SUBMITTED') setLoi('Bạn đã nộp hồ sơ rồi')
      else setLoi(error.message)
    }
  }

  const daNop = hienTai && hienTai.status !== 'REJECTED'
  const tt = hienTai ? TRANG_THAI[hienTai.status] : null

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="mb-1 text-[15px] font-semibold">Xác minh danh tính</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Nộp ảnh hai mặt giấy tờ tuỳ thân. Hệ thống chỉ lưu thông tin về tệp — kích thước, định
          dạng, mã băm — <strong>không lưu ảnh</strong>.
        </p>

        {isLoading && <p className="text-sm text-muted-foreground">Đang tải…</p>}

        {tt && (
          <div className={`mb-4 flex items-center gap-2 rounded-xl border p-3 text-sm ${tt.lop}`}>
            <tt.Icon className="size-4 shrink-0" aria-hidden="true" />
            <span>
              {tt.nhan}
              {hienTai.rejectReason && ` — ${hienTai.rejectReason}`}
            </span>
          </div>
        )}

        {!daNop && !isLoading && (
          <form onSubmit={guiDi} noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="kyc-front">Mặt trước</Label>
                <Input
                  id="kyc-front"
                  type="file"
                  accept="image/*"
                  disabled={dangNop}
                  onChange={(e) => setTruoc(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="kyc-back">Mặt sau</Label>
                <Input
                  id="kyc-back"
                  type="file"
                  accept="image/*"
                  disabled={dangNop}
                  onChange={(e) => setSau(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            <p className="mt-3 mb-0 text-sm font-medium text-destructive empty:hidden" aria-live="polite">
              {loi}
            </p>

            <Button type="submit" className="mt-4 w-full sm:w-auto" disabled={dangNop}>
              <Upload className="size-4" aria-hidden="true" />
              {dangNop ? 'Đang nộp…' : 'Nộp hồ sơ'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
