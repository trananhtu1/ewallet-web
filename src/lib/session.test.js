import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { authToken, clearSession, currentWalletId, readSession, saveSession } from './session'

// AuthResponse that tu POST /api/auth/login - expiresInSeconds = 7200.
const AUTH_RESPONSE = {
  token: 'eyJhbGciOiJIUzI1NiJ9.abc.def',
  expiresInSeconds: 7200,
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

    // 7200 giay = 2 gio ke tu luc luu.
    expect(readSession().expiresAt).toBe(new Date('2026-08-27T12:00:00Z').getTime())
  })

  it('token qua han thi coi nhu chua dang nhap', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-27T10:00:00Z'))
    saveSession(AUTH_RESPONSE)

    // Tai lai trang sau 3 tieng.
    vi.setSystemTime(new Date('2026-08-27T13:00:00Z'))

    expect(readSession()).toBeNull()
    // Va don luon, khong de rac nam lai trong localStorage.
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

    // Con 5 giay nua moi den moc 12:00:00 -> da phai coi la het han.
    vi.setSystemTime(new Date('2026-08-27T11:59:55Z'))
    expect(readSession()).toBeNull()
  })

  it('con nhieu thoi gian thi van hop le', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-27T10:00:00Z'))
    saveSession(AUTH_RESPONSE)

    vi.setSystemTime(new Date('2026-08-27T11:30:00Z'))
    expect(readSession()).not.toBeNull()
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
