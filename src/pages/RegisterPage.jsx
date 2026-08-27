import clsx from 'clsx'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { groupFieldErrors } from '../lib/api'
import { validateEmail, validateFullName, validatePassword } from '../lib/authRules'

export default function RegisterPage() {
  const { session, signUp } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '', fullName: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [busy, setBusy] = useState(false)

  const update = (name) => (event) => setForm((f) => ({ ...f, [name]: event.target.value }))

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError(null)

    // Kiem truoc de bao loi ngay. Backend van kiem lai va no moi la thu quyet dinh.
    const errors = {}
    const emailError = validateEmail(form.email)
    const passwordError = validatePassword(form.password)
    const nameError = validateFullName(form.fullName)

    if (emailError) errors.email = [emailError]
    if (passwordError) errors.password = [passwordError]
    if (nameError) errors.fullName = [nameError]

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setBusy(true)
    try {
      // Dang ky xong co token luon, khong bat dang nhap lai.
      await signUp(form.email.trim(), form.password, form.fullName.trim())
      navigate('/', { replace: true })
    } catch (error) {
      if (error.code === 'EMAIL_ALREADY_USED') {
        // Dat DUOI o email chu khong phai loi toan form: nguoi dung sua duoc ngay
        // o dung cho, va o kia moi la cho sai.
        setFieldErrors({ email: ['Email này đã được dùng'] })
      } else if (error.code === 'VALIDATION_FAILED') {
        setFieldErrors(groupFieldErrors(error.fieldErrors))
      } else {
        setFormError(error.message)
      }
    } finally {
      setBusy(false)
    }
  }

  if (session) return <Navigate to="/" replace />

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1 className="auth-title">Tạo tài khoản</h1>

        {formError && <p className="error error--form">{formError}</p>}

        <label className="field">
          <span className="label">Họ tên</span>
          <input
            className={clsx('input', fieldErrors.fullName && 'input--error')}
            value={form.fullName}
            onChange={update('fullName')}
            autoComplete="name"
            disabled={busy}
          />
          {fieldErrors.fullName?.map((message) => (
            <span key={message} className="error">{message}</span>
          ))}
        </label>

        <label className="field">
          <span className="label">Email</span>
          <input
            className={clsx('input', fieldErrors.email && 'input--error')}
            type="email"
            value={form.email}
            onChange={update('email')}
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
            value={form.password}
            onChange={update('password')}
            autoComplete="new-password"
            disabled={busy}
          />
          {fieldErrors.password?.map((message) => (
            <span key={message} className="error">{message}</span>
          ))}
          <span className="hint">Từ 8 đến 72 ký tự</span>
        </label>

        <button className="button button--primary" disabled={busy}>
          {busy ? 'Đang tạo…' : 'Tạo tài khoản'}
        </button>

        <p className="auth-switch">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </form>
    </div>
  )
}
