import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  authToken,
  clearSession,
  currentWalletId,
  isAccessTokenFresh,
  readSession,
  saveSession,
} from './session'

// AuthResponse that tu POST /api/auth/login. expiresInSeconds = 900 (15 phut) -
// truoc day la 7200, doi cung luc voi refresh token.
const AUTH_RESPONSE = {
  token: 'eyJhbGciOiJIUzI1NiJ9.abc.def',
  refreshToken: 'aG9hbi10b2FuLW5nYXUtbmhpZW4',
  expiresInSeconds: 900,
  walletId: 4,
  fullName: 'Richard Tran',
}

beforeEach(() => {
  localStorage.clear()
  vi.useRealTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('luu va doc phien', () => {
  it('doc lai duoc phien vua luu', () => {
    saveSession(AUTH_RESPONSE)

    expect(readSession()).toMatchObject({
      token: AUTH_RESPONSE.token,
      walletId: 4,
      fullName: 'Richard Tran',
    })
    expect(authToken()).toBe(AUTH_RESPONSE.token)
    expect(currentWalletId()).toBe(4)
  })

  it('chua dang nhap thi khong co gi ca', () => {
    expect(readSession()).toBeNull()
    expect(authToken()).toBeNull()
    // null chu KHONG phai 1: doan bua mot id vi la di doc vi cua nguoi khac.
    expect(currentWalletId()).toBeNull()
  })

  it('dang xuat thi xoa han', () => {
    saveSession(AUTH_RESPONSE)
    clearSession()

    expect(readSession()).toBeNull()
    expect(localStorage.getItem('ewallet.session')).toBeNull()
  })
})

describe('het han', () => {
  it('luu MOC het han, khong luu so giay con lai', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-27T10:00:00Z'))

    saveSession(AUTH_RESPONSE)

    // 900 giay = 15 phut ke tu luc luu.
    expect(readSession().expiresAt).toBe(new Date('2026-08-27T10:15:00Z').getTime())
  })

  /**
   * ⭐ Doi hanh vi co chu dich, va day la test ghi lai dieu do.
   *
   * Truoc khi co refresh token: access token het han = het phien, xoa luon.
   * Gio: het han chi co nghia la "phai doi token", con phien thi VAN CON - vi
   * refresh token trong do song 7 ngay.
   *
   * Xoa phien o day thi nguoi dung bi da ra man dang nhap moi 15 phut, va cai
   * refresh token nam ngay ben canh khong bao gio duoc dung toi.
   */
  it('access token qua han thi PHIEN VAN CON - chi la phai doi token', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-27T10:00:00Z'))
    saveSession(AUTH_RESPONSE)

    // Tai lai trang sau 3 tieng - access token het tu lau.
    vi.setSystemTime(new Date('2026-08-27T13:00:00Z'))

    expect(readSession()).not.toBeNull()
    expect(isAccessTokenFresh(readSession())).toBe(false)
  })

  it('phien khong co refreshToken thi khong cuu duoc - coi nhu chua dang nhap', () => {
    // Hinh dang phien luu tu ban FE cu, truoc khi co refresh token.
    localStorage.setItem(
      'ewallet.session',
      JSON.stringify({ token: 'chi-co-access', walletId: 4, expiresAt: Date.now() + 900_000 }),
    )

    expect(readSession()).toBeNull()
    expect(localStorage.getItem('ewallet.session')).toBeNull()
  })

  /**
   * Bien an: token con dung vai giay.
   *
   * Neu coi no la con hop le, request gui di se ve 401 giua chung - nguoi dung
   * thay mot loi lung thay vi man dang nhap tu te. Tru hao 10 giay de tranh dung
   * canh do.
   */
  it('coi la het han som 10 giay truoc moc that', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-27T10:00:00Z'))
    saveSession(AUTH_RESPONSE)

    // Con 5 giay nua moi den moc 10:15:00 -> da phai coi la het han.
    vi.setSystemTime(new Date('2026-08-27T10:14:55Z'))
    expect(isAccessTokenFresh(readSession())).toBe(false)
  })

  it('con nhieu thoi gian thi van con tuoi', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-27T10:00:00Z'))
    saveSession(AUTH_RESPONSE)

    vi.setSystemTime(new Date('2026-08-27T10:05:00Z'))
    expect(isAccessTokenFresh(readSession())).toBe(true)
  })

  /**
   * /api/auth/refresh KHONG tra ve fullName - backend bo di co y, client da biet
   * roi. Ghi de bang undefined thi header se hien "undefined · Vi #4".
   */
  it('giu lai fullName khi response doi token khong co truong do', () => {
    saveSession(AUTH_RESPONSE)
    saveSession({ token: 'moi', refreshToken: 'moi', expiresInSeconds: 900, walletId: 4 })

    expect(readSession().fullName).toBe('Richard Tran')
  })
})

describe('du lieu hong', () => {
  it('JSON hong thi coi nhu chua dang nhap, khong vo app', () => {
    localStorage.setItem('ewallet.session', 'khong-phai-json')

    expect(readSession()).toBeNull()
    expect(localStorage.getItem('ewallet.session')).toBeNull()
  })

  it('thieu token thi khong nhan', () => {
    localStorage.setItem(
      'ewallet.session',
      JSON.stringify({ walletId: 1, expiresAt: Date.now() + 60_000 }),
    )

    expect(readSession()).toBeNull()
  })

  it('localStorage bi chan thi tra null thay vi nem loi', () => {
    // Xay ra that o mot so cau hinh che do rieng tu.
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new DOMException('SecurityError')
      },
      setItem: () => {
        throw new DOMException('SecurityError')
      },
      removeItem: () => {},
    })

    expect(() => readSession()).not.toThrow()
    expect(readSession()).toBeNull()

    // Va luu van tra ve session dung de PHIEN NAY dung duoc, chi la tai lai
    // trang thi phai dang nhap lai.
    expect(saveSession(AUTH_RESPONSE).walletId).toBe(4)
  })
})
