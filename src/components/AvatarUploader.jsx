import { Camera } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { useGetMeQuery, useUploadAvatarMutation } from '../store/walletApi'
import Avatar from './Avatar'
import { Button } from './ui/button'

/**
 * Doi anh dai dien.
 *
 * <p>⭐ Anh duoc thu nho <b>ngay tren trinh duyet</b> truoc khi gui: mot tam anh
 * 4MB tu dien thoai thanh ~60KB. Backend van thu nho lai lan nua - khong tin
 * client - nhung lam o day tiet kiem cho nguoi dung ca thoi gian cho lan dung
 * luong mang.
 *
 * <p>⚠️ Va no <b>khong thay the</b> viec xu ly o may chu. Ai cung go duoc mot cau
 * lenh gui thang file goc len API, bo qua toan bo doan JavaScript nay. Thu nho o
 * day la mot <b>tien nghi</b>, khong phai mot <b>bien phap</b> - hai thu de nham
 * lan, va nham thi thanh mot lo hong.
 */
export default function AvatarUploader() {
  const { data: me } = useGetMeQuery()
  const [upload, { isLoading: dangGui }] = useUploadAvatarMutation()
  const inputRef = useRef(null)
  const [loi, setLoi] = useState(null)

  async function chonAnh(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setLoi(null)

    try {
      const nho = await thuNho(file)
      const fd = new FormData()
      fd.append('file', nho, 'avatar.jpg')

      await upload(fd).unwrap()
      toast.success('Đã đổi ảnh đại diện')
    } catch (error) {
      if (error.code === 'STORAGE_DISABLED') {
        setLoi('Máy chủ này chưa bật kho ảnh. Xem app.storage.* trong cấu hình.')
      } else {
        setLoi(error.message ?? 'Không đổi được ảnh')
      }
    } finally {
      // Xoa gia tri de chon LAI CUNG MOT FILE van kich hoat onChange. Khong lam
      // thi nguoi dung thu lai sau khi loi se thay khong co gi xay ra.
      event.target.value = ''
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar url={me?.avatarUrl} name={me?.fullName} size={64} />

      <div className="min-w-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={dangGui}
          onClick={() => inputRef.current?.click()}
        >
          <Camera className="size-4" aria-hidden="true" />
          {dangGui ? 'Đang tải…' : 'Đổi ảnh'}
        </Button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={chonAnh}
          // Tuy khong hien ra, van can nhan cho trinh doc man hinh: nut ben tren
          // moi la thu nguoi dung thay, nhung o nhap moi la thu nhan su kien.
          aria-label="Chọn ảnh đại diện"
        />

        <p className="mt-2 mb-0 text-xs text-muted-foreground">
          Ảnh được cắt vuông và thu về 256px. Thông tin vị trí trong ảnh bị xoá.
        </p>

        <p className="mt-1 mb-0 text-sm text-destructive empty:hidden" aria-live="polite">
          {loi}
        </p>
      </div>
    </div>
  )
}

/**
 * Thu nho anh xuong toi da 512px bang canvas, xuat ra JPEG chat luong 0.85.
 *
 * <p>512 chu khong 256: backend cat vuong o giua roi thu ve 256, nen gui du lieu
 * gap doi de no con cho ma cat ma khong bi ro.
 */
function thuNho(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      // Giai phong ngay khi doc xong: moi createObjectURL giu file trong bo nho
      // cho toi khi duoc thu hoi, va nguoi dung co the thu nhieu anh lien tiep.
      URL.revokeObjectURL(url)

      const canh = Math.min(512, Math.max(img.width, img.height))
      const tyLe = canh / Math.max(img.width, img.height)

      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * tyLe)
      canvas.height = Math.round(img.height * tyLe)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)

      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('resize'))), 'image/jpeg', 0.85)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Không đọc được ảnh'))
    }

    img.src = url
  })
}
