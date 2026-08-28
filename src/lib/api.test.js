import { afterEach, describe, expect, it } from 'vitest'
import { fail, canceled, mockAdapter, networkDown, ok, restoreAdapter, sentBody } from '../test/axiosMock'
import { ApiError, NetworkError, api, deposit, groupFieldErrors, transfer } from './api'

/**
 * Bat lay config cua axios o tang adapter de xem FE THUC SU gui gi len day.
 *
 * ⚠️ Cac test duoi PHAI await truoc khi doc adapter. Tu khi co refresh token,
 * api() co mot `await` (kiem/doi token) TRUOC khi request roi may - nen o tick
 * dau tien adapter chua he duoc goi, va mock.calls[0] con la undefined.
 */
const okWallet = ok({ id: 1, balance: '300000.50', version: 1 })

afterEach(restoreAdapter)

describe('gui tien len server', () => {
  /**
   * Test quan trong nhat file nay.
   *
   * money.js canh giu chieu NHAN VE. Cho nay canh chieu GUI LEN - va do la cho
   * tung sai: `Number(amount)` lam hong so tien ngay truoc khi roi trinh duyet,
   * truoc ca khi backend kip nhin thay no.
   *
   * <p>axios KHONG cuu duoc loi do: no JSON.stringify cai object minh dua cho,
   * nen mot so da hong tu truoc thi no gui di dung so hong ay.
   */
  it('gui so tien duoi dang CHUOI, khong phai so', async () => {
    const adapter = mockAdapter(okWallet)
    await deposit(1, '12345678901234567.89')

    const body = sentBody(adapter)

    expect(body.amount).toBe('12345678901234567.89')
    expect(typeof body.amount).toBe('string')

    // Neu ai do doi lai thanh Number(), day la con so se bi gui di:
    expect(body.amount).not.toBe(12345678901234568)
  })

  it('van gui ID vi duoi dang so', async () => {
    const adapter = mockAdapter(okWallet)
    await transfer('1', '2', '30000.00')

    expect(sentBody(adapter)).toEqual({ fromWalletId: 1, toWalletId: 2, amount: '30000.00' })
  })

  it('cat khoang trang thua nguoi dung go vao', async () => {
    const adapter = mockAdapter(okWallet)
    await deposit(1, '  50000.00  ')

    expect(sentBody(adapter).amount).toBe('50000.00')
  })
})

describe('doc loi tu backend', () => {
  it('giu code, status va fieldErrors tu response', async () => {
    mockAdapter(fail(400, {
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
    // Server CO tra loi, chi la tra ve loi - day la ly do api() khong the dua
    // vao try/catch de biet request that bai.
    mockAdapter(fail(409, { status: 409, code: 'INSUFFICIENT_FUNDS', message: 'Số dư không đủ' }))

    const error = await api('/api/transfers').catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).not.toBeInstanceOf(NetworkError)
    expect(error.code).toBe('INSUFFICIENT_FUNDS')
  })

  it('phan biet mang chet voi loi server tra ve', async () => {
    mockAdapter(networkDown())

    const error = await api('/api/wallets/1').catch((e) => e)

    expect(error).toBeInstanceOf(NetworkError)
    expect(error.code).toBe('NETWORK')
  })

  it('khong nuot AbortError - huy request khong phai la that bai', async () => {
    mockAdapter(canceled())

    const error = await api('/api/wallets/1').catch((e) => e)

    // Giu ten 'AbortError' chu khong phai 'CanceledError' rieng cua axios:
    // do la hop dong cu ma cac cho khac trong app dang doc.
    expect(error.name).toBe('AbortError')
    expect(error).not.toBeInstanceOf(NetworkError)
  })

  it('chiu duoc response loi khong phai JSON', async () => {
    // Vi du that: Render tra ve trang HTML 502 luc service dang khoi dong lai.
    mockAdapter(fail(502, '<html><body>502 Bad Gateway</body></html>'))

    const error = await api('/api/wallets/1').catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('UNKNOWN')
    expect(error.message).toBe('Có lỗi xảy ra, thử lại sau')
  })

  it('204 khong body tra ve null, khong phai chuoi rong', async () => {
    // axios dua 204 ve `data: ''`. Chuoi rong la mot GIA TRI - de nguyen thi
    // cho goi phai di kiem `data === ''` thay vi chi kiem null.
    mockAdapter(ok('', 204))

    expect(await api('/api/auth/logout', { method: 'POST' })).toBeNull()
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
