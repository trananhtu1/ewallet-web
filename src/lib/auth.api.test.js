import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fail, mockAdapter, ok, restoreAdapter, sentBody, sentHeader } from '../test/axiosMock'
import { api, login, register, setSessionExpiredHandler } from './api'
import { saveSession } from './session'

const AUTH_RESPONSE = {
  token: 'token-abc',
  refreshToken: 'rt-token-abc',
  expiresInSeconds: 7200,
  walletId: 4,
  fullName: 'Richard Tran',
}

function unauthorized(code) {
  return fail(401, { status: 401, code, message: 'Không được phép' })
}

beforeEach(() => {
  localStorage.clear()
  setSessionExpiredHandler(() => {})
})

afterEach(() => {
  restoreAdapter()
  vi.unstubAllGlobals()
  setSessionExpiredHandler(() => {})
})

describe('gan token vao request', () => {
  it('co phien thi gan Authorization: Bearer', async () => {
    saveSession({ token: 'token-abc', refreshToken: 'rt-token-abc', expiresInSeconds: 7200, walletId: 4, fullName: 'R' })
    const adapter = mockAdapter(ok({}))

    await api('/api/wallets/4')

    expect(sentHeader(adapter, 0, 'Authorization')).toBe('Bearer token-abc')
  })

  it('chua dang nhap thi KHONG gan header rong', async () => {
    const adapter = mockAdapter(ok({}))

    await api('/api/wallets/4')

    // Gui "Authorization: Bearer null" con te hon la khong gui gi.
    expect(sentHeader(adapter, 0, 'Authorization')).toBeUndefined()
  })

  it('token het han thi khong gan nua', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-27T10:00:00Z'))
    saveSession({ token: 'token-cu', refreshToken: 'rt-token-cu', expiresInSeconds: 7200, walletId: 4, fullName: 'R' })
    vi.setSystemTime(new Date('2026-08-27T13:00:00Z'))

    // Adapter tra ve {} cho ca /refresh, tuc la lan doi token khong ra token nao.
    // Lan goi 0 CHINH LA /api/auth/refresh (no di truoc, va mang skipAuth nen
    // khong bao gio co Authorization); lan goi 1 moi la request that.
    const adapter = mockAdapter(ok({}))
    await api('/api/wallets/4')

    expect(sentHeader(adapter, 0, 'Authorization')).toBeUndefined()
    expect(sentHeader(adapter, 1, 'Authorization')).toBeUndefined()
    vi.useRealTimers()
  })
})

/**
 * Cho tinh te nhat cua ca tang API.
 *
 * Hai tinh huong deu tra HTTP 401, nhung y nghia nguoc nhau:
 *
 *   - Da co token ma bi 401  -> phien het han giua chung -> dang xuat
 *   - Chua co token ma bi 401 -> dang go sai mat khau    -> TUYET DOI khong dang xuat
 *
 * Khong phan biet thi man dang nhap se tu da chinh no moi lan go sai.
 *
 * <p>Cai phan biet hai ca nay la co `hadToken` ma request interceptor dat len
 * config - xem http.js. Do la ly do no phai nam tren config chu khong phai mot
 * bien module: hai request song song co the mot cai co token, mot cai khong.
 */
describe('hai loai 401', () => {
  it('401 khi DANG co token = phien het han -> bao ra ngoai', async () => {
    saveSession({ token: 'token-abc', refreshToken: 'rt-token-abc', expiresInSeconds: 7200, walletId: 4, fullName: 'R' })

    const onExpired = vi.fn()
    setSessionExpiredHandler(onExpired)
    mockAdapter(unauthorized('UNAUTHENTICATED'))

    await api('/api/wallets/4').catch(() => {})

    expect(onExpired).toHaveBeenCalledOnce()
  })

  it('401 khi CHUA co token = sai mat khau -> khong dang xuat ai ca', async () => {
    const onExpired = vi.fn()
    setSessionExpiredHandler(onExpired)
    mockAdapter(unauthorized('INVALID_CREDENTIALS'))

    const error = await login('sai@vieted.com', 'sai-mat-khau').catch((e) => e)

    expect(error.code).toBe('INVALID_CREDENTIALS')
    expect(onExpired).not.toHaveBeenCalled()
  })
})

describe('endpoint auth', () => {
  it('register gui dung ba truong va doc duoc 201', async () => {
    const adapter = mockAdapter(ok(AUTH_RESPONSE, 201))

    const result = await register('anh@vieted.com', 'matkhau12345', 'Richard Tran')

    expect(adapter.mock.calls[0][0].url).toContain('/api/auth/register')
    expect(sentBody(adapter)).toEqual({
      email: 'anh@vieted.com',
      password: 'matkhau12345',
      fullName: 'Richard Tran',
    })
    // 201 cung qua duoc validateStatus - api() khong duoc chi chap nhan dung 200.
    expect(result.walletId).toBe(4)
  })

  it('login gui email va mat khau nguyen van', async () => {
    const adapter = mockAdapter(ok(AUTH_RESPONSE))

    await login('Anh@Vieted.com', 'matkhau12345')

    // KHONG tu .toLowerCase(): backend da lo chuyen hoa thuong. FE tu doi la
    // hai ben xu ly khac nhau tren cung mot du lieu.
    expect(sentBody(adapter)).toEqual({
      email: 'Anh@Vieted.com',
      password: 'matkhau12345',
    })
  })
})
