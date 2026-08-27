import { authToken } from './session'

// Vite chi day ra trinh duyet nhung bien bat dau bang VITE_.
// Moi thu co tien to VITE_ deu la CONG KHAI - ai mo DevTools cung doc duoc.
const BASE_URL = import.meta.env.VITE_API_URL

/**
 * Duoc goi khi token HET HAN giua chung (server tra 401 cho mot request DA co
 * token). AuthProvider dang ky ham nay de xoa phien, roi RequireAuth tu day
 * nguoi dung ve /login.
 *
 * <p>Lam bang callback chu khong import router vao day: tang lib khong duoc
 * biet gi ve React hay dieu huong, neu khong thi khong test noi no bang Node.
 */
let onSessionExpired = () => {}

export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler
}

/**
 * Loi tu backend, giu nguyen hop dong loi cua API.
 *
 * Backend tra ve DUNG MOT hinh dang cho moi loi:
 *   { timestamp, status, code, message, path, fieldErrors? }
 *
 * Component re nhanh theo `code`, KHONG BAO GIO theo `message`:
 * message la chu tieng Viet cho nguoi dung doc va co the doi bat cu luc nao,
 * code la hop dong.
 */
export class ApiError extends Error {
  constructor(body, httpStatus) {
    super(body?.message ?? 'Có lỗi xảy ra, thử lại sau')
    this.name = 'ApiError'
    this.code = body?.code ?? 'UNKNOWN'
    this.status = httpStatus
    // LUON la mang - mot field co the truot NHIEU luat cung luc.
    // Vi du that: amount = 0.001 truot ca DecimalMin lan Digits.
    this.fieldErrors = body?.fieldErrors ?? []
  }
}

/** Loi mang: khong noi toi duoc server. Khac han loi do server TRA VE. */
export class NetworkError extends Error {
  constructor(cause) {
    super('Không kết nối được tới máy chủ')
    this.name = 'NetworkError'
    this.code = 'NETWORK'
    this.cause = cause
  }
}

export async function api(path, options = {}) {
  // DUNG MOT CHO gan token cho moi request. Doi cach xac thuc thi sua o day,
  // khong phai di tim tung cho goi API.
  const token = authToken()

  let response
  try {
    response = await fetch(BASE_URL + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    })
  } catch (error) {
    // fetch CHI nem loi khi mang chet. 4xx/5xx thi no van resolve binh thuong,
    // nen khong the dua vao try/catch de biet request that bai.
    if (error.name === 'AbortError') throw error
    throw new NetworkError(error)
  }

  const body = response.status === 204 ? null : await response.json().catch(() => null)

  if (!response.ok) {
    // 401 CO token = phien het han giua chung -> dang xuat.
    // 401 KHONG co token = dang nhap sai mat khau -> tuyet doi khong dang xuat,
    // khong thi man dang nhap se tu da chinh no moi lan go sai.
    if (response.status === 401 && token) onSessionExpired()

    throw new ApiError(body, response.status)
  }

  return body
}

// === Cac loi goi cu the ===
// Gom o day de component khong phai nho duong dan, va doi duong dan thi sua mot cho.

/**
 * Ca hai tra ve AuthResponse: { token, expiresInSeconds, walletId, fullName }.
 *
 * <p>register tra 201 chu khong phai 200 - mot nguoi dung va mot vi vua duoc
 * TAO RA. api() khong phan biet 200 voi 201, ca hai deu la response.ok.
 */
export const register = (email, password, fullName) =>
  api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, fullName }),
  })

export const login = (email, password) =>
  api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

export const getWallet = (walletId, options) => api(`/api/wallets/${walletId}`, options)

export const getTransactions = (walletId, limit = 20, options) =>
  api(`/api/wallets/${walletId}/transactions?limit=${limit}`, options)

/**
 * Tien GUI LEN cung phai la CHUOI, khong chi luc nhan ve.
 *
 * <p>Truoc day cho nay goi Number(amount). Doc thi hop ly - backend nhan
 * BigDecimal ma. Nhung Number() lam hong so tien NGAY TRUOC KHI roi trinh
 * duyet, dung cai loi ma ca money.js duoc viet ra de tranh:
 *
 *   Number('12345678901234567.89')  ->  12345678901234568
 *
 * Va validateAmount() cho phep toi 17 chu so phan nguyen, nen so nay la hop le
 * chu khong phai ca vien tuong.
 *
 * Da do tren chinh backend (target/classes + dung ban Jackson cua no):
 * gui chuoi "12345678901234567.89" thi BigDecimal nhan duoc dung tung chu so.
 * Jackson ep chuoi -> BigDecimal san, khong can sua gi ben backend.
 *
 * ID vi thi van de Number: chung la `long` va la so nguyen nho, khong co gi de mat.
 */
export const deposit = (walletId, amount) =>
  api(`/api/wallets/${walletId}/deposits`, {
    method: 'POST',
    body: JSON.stringify({ amount: String(amount).trim() }),
  })

export const transfer = (fromWalletId, toWalletId, amount) =>
  api('/api/transfers', {
    method: 'POST',
    body: JSON.stringify({
      fromWalletId: Number(fromWalletId),
      toWalletId: Number(toWalletId),
      amount: String(amount).trim(),
    }),
  })

/**
 * Gom fieldErrors theo ten field.
 *
 * fieldErrors la MANG chu khong phai object, vi mot field co the co nhieu loi.
 * Ham nay bien no thanh { amount: ["loi 1", "loi 2"] } cho de render.
 */
export function groupFieldErrors(fieldErrors = []) {
  return fieldErrors.reduce((acc, item) => {
    acc[item.field] = [...(acc[item.field] ?? []), item.message]
    return acc
  }, {})
}
