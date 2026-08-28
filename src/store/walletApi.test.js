import { afterEach, describe, expect, it } from 'vitest'
import { mockAdapter, ok, restoreAdapter, sentBody } from '../test/axiosMock'
import { saveSession, clearSession } from '../lib/session'
import { makeStore } from './index'
import { walletApi } from './walletApi'

/**
 * ⭐ File nay sinh ra vi mot lo hong PHAT HIEN LUC REVIEW, khong phai vi mot
 * tinh nang moi.
 *
 * <p>Luat "tien gui len phai la CHUOI" giờ nam o HAI noi:
 *
 * <pre>
 *   src/lib/api.js        co test (api.test.js)  ·  app KHONG con dung
 *   src/store/walletApi.js KHONG co test         ·  app THUC SU dung  &lt;- day
 * </pre>
 *
 * Nghia la test dat gia nhat cua ca frontend dang canh mot duong code CHET.
 * Ai do "don dep" walletApi.js roi viet `Number(amount)` thi 85 test van xanh
 * va tien hong - dung loai loi im lang ma ca project nay di do suot.
 *
 * <p>Vi sao khong xoa luon api.js cho gon: cac ham do van la duong duy nhat co
 * test cho phan doi loi (ApiError, NetworkError, huy request). Xoa mot luot la
 * mot PR khac; o day chi bit lo hong.
 */

function datPhien() {
  saveSession({
    token: 'access',
    refreshToken: 'refresh',
    expiresInSeconds: 900,
    walletId: 3,
    fullName: 'QA',
  })
}

afterEach(() => {
  restoreAdapter()
  clearSession()
})

describe('walletApi gui tien len server', () => {
  /**
   * Test quan trong nhat file nay - va no la ban sao co chu dich cua test trong
   * api.test.js. Hai duong code cung mot luat thi phai co hai test, neu khong
   * thi mot trong hai duong se truot ma khong ai biet.
   */
  it('nap tien: gui so tien duoi dang CHUOI, khong phai so', async () => {
    datPhien()
    const adapter = mockAdapter(ok({ id: 3, balance: '1.00' }))
    const store = makeStore()

    await store.dispatch(
      walletApi.endpoints.deposit.initiate({ walletId: 3, amount: '12345678901234567.89' }),
    )

    const body = sentBody(adapter, 0)
    expect(body.amount).toBe('12345678901234567.89')
    expect(typeof body.amount).toBe('string')
  })

  it('chuyen tien: so tien la CHUOI, id vi van la SO', async () => {
    datPhien()
    const adapter = mockAdapter(ok({ id: 3, balance: '1.00' }))
    const store = makeStore()

    await store.dispatch(
      walletApi.endpoints.transfer.initiate({
        fromWalletId: '3',
        toWalletId: '4',
        amount: '30000.00',
      }),
    )

    const body = sentBody(adapter, 0)
    expect(body.amount).toBe('30000.00')
    expect(typeof body.amount).toBe('string')
    // ID vi thi Number la dung: chung la `long` va la so nguyen nho, khong co
    // gi de mat. Chi TIEN moi phai giu nguyen dang chuoi.
    expect(body.fromWalletId).toBe(3)
    expect(body.toWalletId).toBe(4)
  })

  it('cat khoang trang thua nguoi dung go vao', async () => {
    datPhien()
    const adapter = mockAdapter(ok({ id: 3, balance: '1.00' }))
    const store = makeStore()

    await store.dispatch(
      walletApi.endpoints.deposit.initiate({ walletId: 3, amount: '  50000.00  ' }),
    )

    expect(sentBody(adapter, 0).amount).toBe('50000.00')
  })

  /**
   * Backend tra so du duoi dang CHUOI (@JsonFormat(shape = STRING)) chinh de
   * JavaScript khong lam hong no. Test nay canh cho RTK Query khong tu doi
   * kieu tren duong di.
   */
  it('so du tu server ve giu nguyen dang chuoi, khong bi doi thanh so', async () => {
    datPhien()
    mockAdapter(ok({ id: 3, balance: '12345678901234567.89', version: 1 }))
    const store = makeStore()

    const result = await store.dispatch(walletApi.endpoints.getWallet.initiate(3))

    expect(result.data.balance).toBe('12345678901234567.89')
    expect(typeof result.data.balance).toBe('string')
  })
})
