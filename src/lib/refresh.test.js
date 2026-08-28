import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from './api'
import { clearSession, readSession, saveSession } from './session'

/**
 * ⭐ File test nay canh giu MOT cau, va do la cau dat nhat cua ca tinh nang:
 *
 *   nhieu request cung thay token het han  ->  CHI MOT lan goi /api/auth/refresh
 *
 * Vi sao no dat: backend xoay vong refresh token, moi cai dung DUNG MOT LAN, va
 * mot token da dung duoc trinh ra lan nua thi no coi la bang chung co hai ban sao
 * -> thu hoi CA CHUOI, nguoi dung bi da ra man dang nhap.
 *
 * Ma WalletPage goi getWallet + getTransactions bang Promise.all. Khong gop lai
 * thi client tu kich hoat co che chong trom cua chinh no. Da do tren backend that:
 * hai lenh /refresh song song -> 200 va 401, audit_log ghi
 * REFRESH_TOKEN_REUSED / CONCURRENT_CLAIM / revokedCount 2.
 */

const HET_HAN = -60_000 // token het han tu 1 phut truoc
const CON_HAN = 900_000 // 15 phut nua

function datPhien({ conHan }) {
  saveSession({
    token: 'access-cu',
    refreshToken: 'refresh-cu',
    expiresInSeconds: conHan ? CON_HAN / 1000 : HET_HAN / 1000,
    walletId: 3,
    fullName: 'QA Tu Dong',
  })
}

/** Tra ve fetch gia + bo dem so lan tung duong dan bi goi. */
function mockFetch() {
  const goi = { refresh: 0, khac: 0 }

  const fetchMock = vi.fn(async (url) => {
    if (String(url).includes('/api/auth/refresh')) {
      goi.refresh += 1
      return {
        ok: true,
        status: 200,
        json: async () => ({
          token: `access-moi-${goi.refresh}`,
          refreshToken: `refresh-moi-${goi.refresh}`,
          expiresInSeconds: 900,
          walletId: 3,
        }),
      }
    }

    goi.khac += 1
    return { ok: true, status: 200, json: async () => ({ id: 3 }) }
  })

  vi.stubGlobal('fetch', fetchMock)
  return { fetchMock, goi }
}

beforeEach(() => clearSession())
afterEach(() => {
  vi.unstubAllGlobals()
  clearSession()
})

describe('doi token ngam', () => {
  it('KHONG doi token khi access token con han', async () => {
    datPhien({ conHan: true })
    const { goi } = mockFetch()

    await api('/api/wallets/me')

    expect(goi.refresh).toBe(0)
    expect(goi.khac).toBe(1)
  })

  it('doi token khi access token het han, roi dung token MOI cho request', async () => {
    datPhien({ conHan: false })
    const { fetchMock, goi } = mockFetch()

    await api('/api/wallets/me')

    expect(goi.refresh).toBe(1)

    // Lan goi thu hai la request that - phai mang token MOI, khong phai cai cu.
    const headers = fetchMock.mock.calls[1][1].headers
    expect(headers.Authorization).toBe('Bearer access-moi-1')
  })

  /**
   * 🚨 Test dat nhat file. Khong co no thi client tu giet phien cua chinh minh
   * moi lan token het han giua luc WalletPage dang tai.
   */
  it('NAM request song song chi lam MOT lan doi token', async () => {
    datPhien({ conHan: false })
    const { goi } = mockFetch()

    await Promise.all([
      api('/api/wallets/me'),
      api('/api/wallets/3/transactions'),
      api('/api/wallets/me'),
      api('/api/wallets/3/transactions'),
      api('/api/wallets/me'),
    ])

    expect(goi.refresh).toBe(1) // <- MOT, khong phai nam
    expect(goi.khac).toBe(5)
  })

  it('lan het han SAU do lai doi tiep, khong dung lai ket qua cu', async () => {
    datPhien({ conHan: false })
    const { goi } = mockFetch()

    await api('/api/wallets/me')
    expect(goi.refresh).toBe(1)

    // Gia lap token moi cung het han.
    datPhien({ conHan: false })
    await api('/api/wallets/me')

    expect(goi.refresh).toBe(2)
  })

  it('doi token that bai -> xoa phien, khong thu di thu lai', async () => {
    datPhien({ conHan: false })

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 401,
        json: async () => ({ code: 'INVALID_REFRESH_TOKEN' }),
      })),
    )

    await expect(api('/api/wallets/me')).rejects.toMatchObject({ status: 401 })
    expect(readSession()).toBeNull()
  })

  /**
   * Phien khong co refreshToken la phien luu tu ban FE cu. Khong cuu duoc, va
   * quan trong hon la khong duoc de no lam app vo o mot cho khac.
   */
  it('phien cu khong co refreshToken bi coi la chua dang nhap', () => {
    localStorage.setItem(
      'ewallet.session',
      JSON.stringify({ token: 'chi-co-access', walletId: 3, expiresAt: Date.now() + CON_HAN }),
    )

    expect(readSession()).toBeNull()
  })
})
