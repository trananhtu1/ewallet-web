import clsx from 'clsx'
import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { useAuth } from '../auth/useAuth'

export default function LoginPage() {
  // busy / formError / fieldErrors deu den tu store - saga dat chung vao do.
  // Man nay khong con try/catch quanh signIn nua.
  const { session, signIn, busy, formError, fieldErrors } = useAuth()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Loi kiem TAI CHO, chua he goi mang - nen no khong thuoc ve store.
  const [localError, setLocalError] = useState(null)

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

  // Mot cho duy nhat lo chuyen dieu huong, cho ca hai truong hop: vua dang
  // nhap xong, va da dang nhap tu truoc ma van go tay URL /login.
  //
  // Truoc day day la hai duong khac nhau - mot cai navigate() sau await, mot
  // cai <Navigate> - va chung de lech nhau. Gio session la thu duy nhat quyet
  // dinh, nen khong con cho de lech.
  if (session) return <Navigate to={location.state?.from ?? '/'} replace />

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1 className="auth-title">Đăng nhập</h1>

        {(localError ?? formError) && (
          <p className="error error--form">{localError ?? formError}</p>
        )}

        <label className="field">
          <span className="label">Email</span>
          <input
            className={clsx('input', fieldErrors.email && 'input--error')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={busy}
          />
          {fieldErrors.email?.map((message) => (
            <span key={message} className="error">{message}</span>
          ))}
        </label>

        <label className="field">
          <span className="label">Mật khẩu</span>
          <input
            className={clsx('input', fieldErrors.password && 'input--error')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={busy}
          />
          {fieldErrors.password?.map((message) => (
            <span key={message} className="error">{message}</span>
          ))}
        </label>

        <button className="button button--primary" disabled={busy}>
          {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>

        <p className="auth-switch">
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </p>
      </form>
    </div>
  )
}
