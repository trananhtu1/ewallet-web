import clsx from 'clsx'
import { useState } from 'react'
import { Link, Navigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { validateEmail, validateFullName, validatePassword } from '../lib/authRules'

export default function RegisterPage() {
  const { session, signUp, busy, formError, fieldErrors: serverFieldErrors } = useAuth()

  const [form, setForm] = useState({ email: '', password: '', fullName: '' })

  // Loi kiem TAI CHO. Tach khoi loi tu server vi chung co vong doi khac nhau:
  // cai nay bien mat khi nguoi dung bam gui lai, cai kia do reducer don.
  const [localFieldErrors, setLocalFieldErrors] = useState({})

  const update = (name) => (event) => setForm((f) => ({ ...f, [name]: event.target.value }))

  // Loi tai cho duoc uu tien: no vua duoc tinh lai ngay lan bam nay.
  const fieldErrors = { ...serverFieldErrors, ...localFieldErrors }

  function handleSubmit(event) {
    event.preventDefault()

    // Kiem truoc de bao loi ngay. Backend van kiem lai va no moi la thu quyet dinh.
    const errors = {}
    const emailError = validateEmail(form.email)
    const passwordError = validatePassword(form.password)
    const nameError = validateFullName(form.fullName)

    if (emailError) errors.email = [emailError]
    if (passwordError) errors.password = [passwordError]
    if (nameError) errors.fullName = [nameError]

    setLocalFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    // Dang ky xong co token luon, khong bat dang nhap lai - saga luu phien roi
    // dispatch authSucceeded, va <Navigate> duoi day tu dua nguoi dung vao.
    signUp(form.email.trim(), form.password, form.fullName.trim())
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
