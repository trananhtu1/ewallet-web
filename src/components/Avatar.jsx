import { User } from 'lucide-react'

/**
 * Anh dai dien, hoac chu cai dau khi chua co anh.
 *
 * <p>⚠️ <b>Khong de mot o trong khi chua co anh.</b> Mot vong tron rong nhin nhu
 * anh dang tai do hoac hong; chu cai dau thi ro rang la "chua dat anh".
 *
 * <p>Chu cai lay tu ten, va co ban du phong: ten rong hay chi co khoang trang
 * thi rot ve mot bieu tuong nguoi. `charAt(0)` tren chuoi rong tra ve chuoi rong
 * chu khong loi, nen thieu buoc nay thi ra mot vong tron trong y het truong hop
 * dang muon tranh.
 */
export default function Avatar({ url, name, size = 40 }) {
  const chuCai = (name ?? '').trim().charAt(0).toUpperCase()

  return (
    <span
      className="inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-primary"
      style={{ width: size, height: size }}
    >
      {url ? (
        <img
          src={url}
          // alt rong + aria-hidden: ten nguoi dung luon duoc hien bang CHU o ngay
          // canh. De alt="Anh dai dien cua X" la trinh doc man hinh doc ten hai lan.
          alt=""
          aria-hidden="true"
          className="size-full object-cover"
          width={size}
          height={size}
        />
      ) : chuCai ? (
        <span style={{ fontSize: size * 0.42 }} className="font-semibold" aria-hidden="true">
          {chuCai}
        </span>
      ) : (
        <User style={{ width: size * 0.5, height: size * 0.5 }} aria-hidden="true" />
      )}
    </span>
  )
}
