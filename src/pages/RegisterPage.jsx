import clsx from 'clsx'
import { useState } from 'react'
import { Link, Navigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import AuthLayout from '../components/AuthLayout'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
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
    <AuthLayout>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Tạo tài khoản</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Ví được tạo tự động ngay sau khi đăng ký.
      </p>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} noValidate>
            {formError && <p className="mb-4 text-sm font-medium text-destructive">{formError}</p>}

            <div className="mb-4 grid gap-2">
              <Label htmlFor="fullName">Họ tên</Label>
              <Input
                id="fullName"
                className={clsx(fieldErrors.fullName && 'border-destructive')}
                value={form.fullName}
                onChange={update('fullName')}
                autoComplete="name"
                disabled={busy}
              />
              {fieldErrors.fullName?.map((message) => (
                <span key={message} className="text-sm text-destructive">{message}</span>
              ))}
            </div>

            <div className="mb-4 grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                className={clsx(fieldErrors.email && 'border-destructive')}
                type="email"
                value={form.email}
                onChange={update('email')}
                autoComplete="email"
                disabled={busy}
              />
              {fieldErrors.email?.map((message) => (
                <span key={message} className="text-sm text-destructive">{message}</span>
              ))}
            </div>

            <div className="mb-5 grid gap-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                className={clsx(fieldErrors.password && 'border-destructive')}
                type="password"
                value={form.password}
                onChange={update('password')}
                autoComplete="new-password"
                disabled={busy}
              />
              {fieldErrors.password?.map((message) => (
                <span key={message} className="text-sm text-destructive">{message}</span>
              ))}
              <span className="text-xs text-muted-foreground">Từ 8 đến 72 ký tự</span>
            </div>

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Đang tạo…' : 'Tạo tài khoản'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Đã có tài khoản?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Đăng nhập
        </Link>
      </p>
    </AuthLayout>
  )
}
