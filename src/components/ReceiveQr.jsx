import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { useAuth } from '../auth/useAuth'
import { Card, CardContent } from './ui/card'

/**
 * Ma QR de nguoi khac quet va chuyen tien cho minh.
 *
 * <p>⭐ Noi dung QR chi la <b>ma vi</b>, boc trong mot URI co tien to:
 * {@code ewallet:8}. Khong nhet token, khong nhet ten, khong nhet so du.
 *
 * <p>Ly do: mot ma QR la thu duoc <b>dan len tuong quan ca phe</b>. Bat cu gi
 * nhet vao day deu coi nhu cong khai vinh vien - anh chup lai duoc, in ra duoc,
 * va khong thu hoi duoc. Ma vi thi von da cong khai (nguoi ta phai biet no moi
 * chuyen tien duoc); moi thu khac thi khong.
 *
 * <p>Tien to {@code ewallet:} de trinh quet phan biet duoc ma cua he thong nay
 * voi mot chuoi so bat ky - quet nham ma vach tren hop sua ma ra "chuyen tien
 * cho vi 8934920" la mot cach mat tien rat la.
 */
export default function ReceiveQr() {
  const { session } = useAuth()
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, `ewallet:${session.walletId}`, {
      width: 200,
      margin: 1,
      // Muc sua loi M: doc duoc ke ca khi ma bi che mot goc nho hoac in mo.
      // Muc H chiu duoc nhieu hon nhung lam o vuong day hon, kho quet o xa.
      errorCorrectionLevel: 'M',
    })
  }, [session.walletId])

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="mb-1 text-[15px] font-semibold">Nhận tiền</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Đưa mã này cho người chuyển, hoặc đọc mã ví của bạn.
        </p>

        <div className="flex flex-col items-center gap-3">
          {/*
            Canvas khong co noi dung van ban nao, nen no VO HINH voi trinh doc
            man hinh. Ma vi ghi ra chu ngay ben duoi - do vua la duong doc duoc
            cho ho, vua la duong doc duoc cho nguoi khong quet duoc QR.
          */}
          <canvas ref={canvasRef} aria-hidden="true" className="rounded-xl" />

          <p className="m-0 text-center text-sm">
            Mã ví của bạn: <strong className="text-base">#{session.walletId}</strong>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
