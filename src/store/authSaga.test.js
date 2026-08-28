import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fail, mockAdapter, restoreAdapter } from '../test/axiosMock'
import { signInRequested, signOutRequested } from './authSlice'
import { makeStore } from './index'

/**
 * Saga canh cac hanh dong NGUOI DUNG BAM. File nay canh dung mot cau cho moi
 * hanh dong do - phan con lai (gan token, doi token ngam) thuoc ve tang HTTP
 * va da co refresh.test.js lo.
 */

const AUTH_RESPONSE = {
  token: 'token-abc',
  refreshToken: 'rt-token-abc',
  expiresInSeconds: 7200,
  walletId: 4,
  fullName: 'Richard Tran',
}

/** Response cham co chu dich: de hai lan dispatch chong len nhau that su. */
function slowLogin(delayMs = 20) {
  const state = { calls: 0 }

  mockAdapter(async (config) => {
    state.calls += 1
    await new Promise((resolve) => setTimeout(resolve, delayMs))
    return { data: AUTH_RESPONSE, status: 200, statusText: 'OK', headers: {}, config }
  })

  return state
}

beforeEach(() => localStorage.clear())
afterEach(() => {
  restoreAdapter()
  localStorage.clear()
})

describe('dang nhap', () => {
  /**
   * ⭐ Ly do authSaga dung takeLeading chu khong phai takeEvery.
   *
   * takeEvery: bam dup nut "Đăng nhập" -> HAI request /api/auth/login. Ca hai
   * deu thanh cong, ca hai deu goi saveSession, va refresh token cua lan dau bi
   * ghi de mat - no nam lai tren server o trang thai con song ma khong ai giu.
   *
   * Doi mot chu takeEvery/takeLeading trong authSaga.js la test nay do ngay.
   */
  it('bam dup nut Dang nhap chi goi MOT request', async () => {
    const state = slowLogin()
    const store = makeStore()

    // Hai lan dispatch lien tiep, chua kip cho lan dau xong.
    store.dispatch(signInRequested({ email: 'anh@vieted.com', password: 'matkhau12345' }))
    store.dispatch(signInRequested({ email: 'anh@vieted.com', password: 'matkhau12345' }))

    await vi.waitFor(() => expect(store.getState().auth.session).not.toBeNull())

    expect(state.calls).toBe(1) // <- MOT, khong phai hai
  })

  it('dang nhap xong thi luu phien va tat co busy', async () => {
    slowLogin(0)
    const store = makeStore()

    store.dispatch(signInRequested({ email: 'anh@vieted.com', password: 'matkhau12345' }))
    expect(store.getState().auth.status).toBe('pending')

    await vi.waitFor(() => expect(store.getState().auth.status).toBe('idle'))

    expect(store.getState().auth.session.walletId).toBe(4)
    expect(JSON.parse(localStorage.getItem('ewallet.session')).token).toBe('token-abc')
  })

  /**
   * INVALID_CREDENTIALS co y KHONG phan biet sai email voi sai mat khau. Chi
   * can mot ai do "cai thien trai nghiem" bang cach bao "email khong ton tai"
   * la ho vua tang ke tan cong cong cu do email co that.
   */
  it('sai mat khau: mot thong bao chung, va khong luu gi ca', async () => {
    mockAdapter(fail(401, { status: 401, code: 'INVALID_CREDENTIALS', message: 'Sai roi' }))
    const store = makeStore()

    store.dispatch(signInRequested({ email: 'anh@vieted.com', password: 'sai' }))

    await vi.waitFor(() => expect(store.getState().auth.status).toBe('idle'))

    expect(store.getState().auth.formError).toBe('Email hoặc mật khẩu không đúng')
    expect(store.getState().auth.session).toBeNull()
    expect(localStorage.getItem('ewallet.session')).toBeNull()
  })

  it('VALIDATION_FAILED duoc gom theo tung o nhap', async () => {
    mockAdapter(fail(400, {
      status: 400,
      code: 'VALIDATION_FAILED',
      message: 'Dữ liệu không hợp lệ',
      fieldErrors: [
        { field: 'password', message: 'Tối thiểu 8 ký tự' },
        { field: 'password', message: 'Không được để trống' },
      ],
    }))
    const store = makeStore()

    store.dispatch(signInRequested({ email: 'anh@vieted.com', password: 'x' }))

    await vi.waitFor(() => expect(store.getState().auth.status).toBe('idle'))

    // Mot field, HAI loi - nen fieldErrors luon la mang.
    expect(store.getState().auth.fieldErrors.password).toHaveLength(2)
  })
})

describe('dang xuat', () => {
  /**
   * Dang xuat phai LUON thanh cong o phia nguoi dung. Mat mang hay server chet
   * ma khong cho ra man dang nhap la mot cach lam nguoi ta hoang.
   */
  it('server chet van dang xuat duoc o phia client', async () => {
    localStorage.setItem(
      'ewallet.session',
      JSON.stringify({
        token: 'token-abc',
        refreshToken: 'rt-token-abc',
        walletId: 4,
        expiresAt: Date.now() + 900_000,
      }),
    )

    const store = makeStore()
    expect(store.getState().auth.session).not.toBeNull()

    mockAdapter(fail(500, { status: 500, code: 'INTERNAL', message: 'Server chết' }))
    store.dispatch(signOutRequested())

    await vi.waitFor(() => expect(store.getState().auth.session).toBeNull())

    expect(localStorage.getItem('ewallet.session')).toBeNull()
  })
})
