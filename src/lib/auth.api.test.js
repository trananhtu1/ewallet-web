import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, login, register, setSessionExpiredHandler } from './api'
import { saveSession } from './session'

function mockFetch(response) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const AUTH_RESPONSE = {
  ok: true,
  status: 200,
  json: async () => ({
    token: 'token-abc',
    refreshToken: 'rt-token-abc',
    expiresInSeconds: 7200,
    walletId: 4,
    fullName: 'Richard Tran',
  }),
}

function unauthorized(code) {
  return { ok: false, status: 401, json: async () => ({ status: 401, code, message: 'Không được phép' }) }
}

beforeEach(() => {
  localStorage.clear()
  setSessionExpiredHandler(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  setSessionExpiredHandler(() => {})
})

describe('gan token vao request', () => {
  it('co phien thi gan Authorization: Bearer', async () => {
    saveSession({ token: 'token-abc', refreshToken: 'rt-token-abc', expiresInSeconds: 7200, walletId: 4, fullName: 'R' })
    const fetchMock = mockFetch({ ok: true, status: 200, json: async () => ({}) })

    await api('/api/wallets/4')

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer token-abc')
  })

  it('chua dang nhap thi KHONG gan header rong', async () => {
    const fetchMock = mockFetch({ ok: true, status: 200, json: async () => ({}) })

    await api('/api/wallets/4')

    // Gui "Authorization: Bearer null" con te hon la khong gui gi.
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('Authorization')
  })

  it('token het han thi khong gan nua', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-27T10:00:00Z'))
    saveSession({ token: 'token-cu', refreshToken: 'rt-token-cu', expiresInSeconds: 7200, walletId: 4, fullName: 'R' })
    vi.setSystemTime(new Date('2026-08-27T13:00:00Z'))

    const fetchMock = mockFetch({ ok: true, status: 200, json: async () => ({}) })
    await api('/api/wallets/4')

    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('Authorization')
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
 */
describe('hai loai 401', () => {
  it('401 khi DANG co token = phien het han -> bao ra ngoai', async () => {
    saveSession({ token: 'token-abc', refreshToken: 'rt-token-abc', expiresInSeconds: 7200, walletId: 4, fullName: 'R' })

    const onExpired = vi.fn()
    setSessionExpiredHandler(onExpired)
    mockFetch(unauthorized('UNAUTHENTICATED'))

    await api('/api/wallets/4').catch(() => {})

    expect(onExpired).toHaveBeenCalledOnce()
  })

  it('401 khi CHUA co token = sai mat khau -> khong dang xuat ai ca', async () => {
    const onExpired = vi.fn()
    setSessionExpiredHandler(onExpired)
    mockFetch(unauthorized('INVALID_CREDENTIALS'))

    const error = await login('sai@vieted.com', 'sai-mat-khau').catch((e) => e)

    expect(error.code).toBe('INVALID_CREDENTIALS')
    expect(onExpired).not.toHaveBeenCalled()
  })
})

describe('endpoint auth', () => {
  it('register gui dung ba truong va doc duoc 201', async () => {
    const fetchMock = mockFetch({ ...AUTH_RESPONSE, status: 201 })

    const result = await register('anh@vieted.com', 'matkhau12345', 'Richard Tran')

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/auth/register')
    expect(JSON.parse(options.body)).toEqual({
      email: 'anh@vieted.com',
      password: 'matkhau12345',
      fullName: 'Richard Tran',
    })
    // 201 cung la response.ok - api() khong duoc chi chap nhan dung 200.
    expect(result.walletId).toBe(4)
  })

  it('login gui email va mat khau nguyen van', async () => {
    const fetchMock = mockFetch(AUTH_RESPONSE)

    await login('Anh@Vieted.com', 'matkhau12345')

    // KHONG tu .toLowerCase(): backend da lo chuyen hoa thuong. FE tu doi la
    // hai ben xu ly khac nhau tren cung mot du lieu.
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      email: 'Anh@Vieted.com',
      password: 'matkhau12345',
    })
  })
})
