import clsx from 'clsx'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { groupFieldErrors } from '../lib/api'

export default function LoginPage() {
  const { session, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError(null)
    setFieldErrors({})

    // KHONG kiem dinh dang email o day, du man dang ky co kiem.
    // Bao "email khong dung dinh dang" o man dang nhap chi giup ke do mat khau
    // biet email nao co that - vo ich cho nguoi dung, huu ich cho ke tan cong.
    if (email.trim() === '' || password === '') {
      setFormError('Nhập email và mật khẩu')
      return
    }

    setBusy(true)
    try {
      await signIn(email.trim(), password)
      // Quay lai dung trang dinh vao truoc khi bi chan.
      navigate(location.state?.from ?? '/', { replace: true })
    } catch (error) {
      if (error.code === 'INVALID_CREDENTIALS') {
        // Mot thong bao DUY NHAT cho ca hai truong hop sai email va sai mat khau.
        // Tach ra la tiet lo email nao ton tai trong he thong.
        setFormError('Email hoặc mật khẩu không đúng')
      } else if (error.code === 'VALIDATION_FAILED') {
        setFieldErrors(groupFieldErrors(error.fieldErrors))
      } else {
        setFormError(error.message)
      }
    } finally {
      setBusy(false)
    }
  }

  // Da dang nhap roi ma van vao /login (go tay URL, hoac bam Back) thi khong co
  // ly do gi hien form ra nua.
  if (session) return <Navigate to="/" replace />

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1 className="auth-title">Đăng nhập</h1>

        {formError && <p className="error error--form">{formError}</p>}

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
