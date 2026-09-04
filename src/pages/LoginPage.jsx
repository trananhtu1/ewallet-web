import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { useAuth } from '../auth/useAuth'
import AuthLayout from '../components/AuthLayout'
import ColdStartNotice from '../components/ColdStartNotice'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

// Tai khoan de nguoi xem BAM MOT CAI la vao duoc.
//
// ⭐ Day la thay doi dang gia nhat cua ca man nay. Duong link nay nam trong CV,
// nen nguoi mo no phan lon la nguoi tuyen dung - va truoc day ho phai TU DANG KY
// mot tai khoan moi xem duoc gi ben trong. Phan lon se khong lam, ho dong tab.
//
// Khong phai bi mat: vi demo chi co tien gia, va ma nguon thi cong khai san.
const DEMO = { email: 'demo@ewallet.vn', password: 'demo12345678' }

// Qua bay nhieu giay thi gan nhu chac chan backend dang ngu day.
const WAKE_HINT_AFTER_SECONDS = 4

export default function LoginPage() {
  // busy / formError / fieldErrors deu den tu store - saga dat chung vao do.
  // Man nay khong con try/catch quanh signIn nua.
  const { session, signIn, busy, formError, fieldErrors } = useAuth()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Loi kiem TAI CHO, chua he goi mang - nen no khong thuoc ve store.
  const [localError, setLocalError] = useState(null)

  const [elapsed, setElapsed] = useState(0)

  // Dong ho chi chay trong luc dang cho mang.
  useEffect(() => {
    if (!busy) {
      setElapsed(0)
      return
    }
    const startedAt = Date.now()
    // Tinh bang HIEU cua Date.now(), khong cong don mot bien dem: trinh duyet
    // ha tan suat setInterval khi tab chay nen, cong don se ra so sai bet.
    const timer = setInterval(() => setElapsed(Math.round((Date.now() - startedAt) / 1000)), 500)
    return () => clearInterval(timer)
  }, [busy])

  function handleSubmit(event) {
    event.preventDefault()
    setLocalError(null)

    // KHONG kiem dinh dang email o day, du man dang ky co kiem.
    // Bao "email khong dung dinh dang" o man dang nhap chi giup ke do mat khau
    // biet email nao co that - vo ich cho nguoi dung, huu ich cho ke tan cong.
    if (email.trim() === '' || password === '') {
      setLocalError('Nhập email và mật khẩu')
      return
    }

    // Chi dispatch roi thoi. Ket qua ve qua store, va reducer signInRequested
    // da don formError/fieldErrors cu di.
    signIn(email.trim(), password)
  }

  function dungTaiKhoanDemo() {
    setLocalError(null)
    setEmail(DEMO.email)
    setPassword(DEMO.password)
    // Dang nhap luon, khong bat nguoi ta bam them mot nut nua: bam "dung tai
    // khoan demo" la da noi ro y dinh roi.
    signIn(DEMO.email, DEMO.password)
  }

  // Mot cho duy nhat lo chuyen dieu huong, cho ca hai truong hop: vua dang
  // nhap xong, va da dang nhap tu truoc ma van go tay URL /login.
  //
  // Truoc day day la hai duong khac nhau - mot cai navigate() sau await, mot
  // cai <Navigate> - va chung de lech nhau. Gio session la thu duy nhat quyet
  // dinh, nen khong con cho de lech.
  if (session) return <Navigate to={location.state?.from ?? '/'} replace />

  return (
    <AuthLayout>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Đăng nhập</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Vào ví của bạn để xem số dư và chuyển tiền.
      </p>

      {busy && elapsed >= WAKE_HINT_AFTER_SECONDS && <ColdStartNotice seconds={elapsed} />}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} noValidate>
            {(localError ?? formError) && (
              <p className="mb-4 text-sm font-medium text-destructive">{localError ?? formError}</p>
            )}

            <div className="mb-4 grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                className={clsx(fieldErrors.email && 'border-destructive')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={busy}
              />
              {fieldErrors.email?.map((message) => (
                <span key={message} className="text-sm text-destructive">
                  {message}
                </span>
              ))}
            </div>

            <div className="mb-5 grid gap-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                className={clsx(fieldErrors.password && 'border-destructive')}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={busy}
              />
              {fieldErrors.password?.map((message) => (
                <span key={message} className="text-sm text-destructive">
                  {message}
                </span>
              ))}
            </div>

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </Button>
          </form>

          {/* Ngan cach de nut demo khong bi doc nham la mot phan cua form. */}
          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            hoặc
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={busy}
            onClick={dungTaiKhoanDemo}
          >
            Dùng tài khoản demo
          </Button>

          <p className="mt-2 text-center text-xs text-muted-foreground">
            {DEMO.email} · {DEMO.password}
          </p>
        </CardContent>
      </Card>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Đăng ký
        </Link>
      </p>
    </AuthLayout>
  )
}
