import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, NetworkError, api, deposit, groupFieldErrors, transfer } from './api'

/** Bat lay doi so cua fetch de xem FE THUC SU gui gi len day. */
function mockFetch(response) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const okWallet = {
  ok: true,
  status: 200,
  json: async () => ({ id: 1, balance: '300000.50', version: 1 }),
}

/** Dung khuon loi that cua backend - moi loi, moi endpoint deu mot hinh dang. */
function errorResponse(status, body) {
  return { ok: false, status, json: async () => body }
}

afterEach(() => vi.unstubAllGlobals())

describe('gui tien len server', () => {
  /**
   * Test quan trong nhat file nay.
   *
   * money.js canh giu chieu NHAN VE. Cho nay canh chieu GUI LEN - va do la cho
   * tung sai: `Number(amount)` lam hong so tien ngay truoc khi roi trinh duyet,
   * truoc ca khi backend kip nhin thay no.
   */
  it('gui so tien duoi dang CHUOI, khong phai so', () => {
    const fetchMock = mockFetch(okWallet)
    deposit(1, '12345678901234567.89')

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)

    expect(body.amount).toBe('12345678901234567.89')
    expect(typeof body.amount).toBe('string')

    // Neu ai do doi lai thanh Number(), day la con so se bi gui di:
    expect(body.amount).not.toBe(12345678901234568)
  })

  it('van gui ID vi duoi dang so', () => {
    const fetchMock = mockFetch(okWallet)
    transfer('1', '2', '30000.00')

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)

    expect(body).toEqual({ fromWalletId: 1, toWalletId: 2, amount: '30000.00' })
  })

  it('cat khoang trang thua nguoi dung go vao', () => {
    const fetchMock = mockFetch(okWallet)
    deposit(1, '  50000.00  ')

    expect(JSON.parse(fetchMock.mock.calls[0][1].body).amount).toBe('50000.00')
  })
})

describe('doc loi tu backend', () => {
  it('giu code, status va fieldErrors tu response', async () => {
    mockFetch(errorResponse(400, {
      status: 400,
      code: 'VALIDATION_FAILED',
      message: 'Dữ liệu gửi lên không hợp lệ',
      fieldErrors: [
        { field: 'amount', message: 'Số tiền tối thiểu là 0.01' },
        { field: 'amount', message: 'Số tiền tối đa 2 chữ số thập phân' },
      ],
    }))

    const error = await api('/api/wallets/1/deposits').catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('VALIDATION_FAILED')
    expect(error.status).toBe(400)
    expect(error.fieldErrors).toHaveLength(2)
  })

  it('4xx KHONG duoc coi la loi mang', async () => {
    // fetch chi nem khi mang chet. 409 thi no resolve binh thuong - day la ly do
    // api() khong the dua vao try/catch de biet request that bai.
    mockFetch(errorResponse(409, { status: 409, code: 'INSUFFICIENT_FUNDS', message: 'Số dư không đủ' }))

    const error = await api('/api/transfers').catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).not.toBeInstanceOf(NetworkError)
    expect(error.code).toBe('INSUFFICIENT_FUNDS')
  })

  it('phan biet mang chet voi loi server tra ve', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const error = await api('/api/wallets/1').catch((e) => e)

    expect(error).toBeInstanceOf(NetworkError)
    expect(error.code).toBe('NETWORK')
  })

  it('khong nuot AbortError - huy request khong phai la that bai', async () => {
    const aborted = new DOMException('The operation was aborted.', 'AbortError')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(aborted))

    const error = await api('/api/wallets/1').catch((e) => e)

    // App.jsx dua vao dung dieu nay de bo qua request bi huy luc unmount.
    expect(error.name).toBe('AbortError')
    expect(error).not.toBeInstanceOf(NetworkError)
  })

  it('chiu duoc response loi khong phai JSON', async () => {
    // Vi du that: Render tra ve trang HTML 502 luc service dang khoi dong lai.
    mockFetch({ ok: false, status: 502, json: async () => { throw new SyntaxError('not json') } })

    const error = await api('/api/wallets/1').catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('UNKNOWN')
    expect(error.message).toBe('Có lỗi xảy ra, thử lại sau')
  })
})

describe('groupFieldErrors', () => {
  it('gom nhieu loi cua cung mot field lai', () => {
    // fieldErrors la MANG chu khong phai object: 0.001 truot dong thoi hai luat.
    const grouped = groupFieldErrors([
      { field: 'amount', message: 'Số tiền tối thiểu là 0.01' },
      { field: 'amount', message: 'Số tiền tối đa 2 chữ số thập phân' },
    ])

    expect(grouped.amount).toEqual([
      'Số tiền tối thiểu là 0.01',
      'Số tiền tối đa 2 chữ số thập phân',
    ])
  })

  it('coi thieu fieldErrors la rong', () => {
    expect(groupFieldErrors()).toEqual({})
  })
})
