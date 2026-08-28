import { clearSession, isAccessTokenFresh, readSession, saveSession } from './session'

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

/**
 * ⭐ CHO DE TU BAN VAO CHAN NHAT CA FILE, va no o day chu khong o backend.
 *
 * Backend xoay vong refresh token: moi cai dung duoc DUNG MOT LAN, va neu mot
 * token da dung duoc trinh ra lan nua thi no coi do la bang chung co hai ban sao
 * -> THU HOI CA CHUOI, nguoi dung bi da ra.
 *
 * Ma WalletPage goi hai request SONG SONG bang Promise.all. Neu ca hai cung thay
 * token het han va cung goi /refresh voi cung mot refresh token thi chinh client
 * tu kich hoat co che do. Da do that tren backend:
 *
 *   request 1 -> 200
 *   request 2 -> 401
 *   audit_log -> REFRESH_TOKEN_REUSED, detectedBy CONCURRENT_CLAIM, revokedCount 2
 *
 * Nen: MOT lan doi token tai mot thoi diem. Cac lo'i goi den sau bam vao dung
 * cai Promise dang chay thay vi mo them mot lan doi nua.
 */
let refreshInFlight = null

function refreshOnce() {
  refreshInFlight ??= doRefresh().finally(() => {
    // Xoa NGAY khi xong, du thanh hay bai. Giu lai thi lan het han sau se dung
    // lai ket qua cu - tuc la mot token da chet.
    refreshInFlight = null
  })

  return refreshInFlight
}

async function doRefresh() {
  const session = readSession()
  if (!session?.refreshToken) throw new ApiError(null, 401)

  // Goi thang fetch, KHONG qua api(): api() se lai di kiem token va co the goi
  // refresh lan nua - mot vong lap khong loi thoat.
  const response = await fetch(BASE_URL + '/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(body, response.status)

  return saveSession(body).token
}

/**
 * Token de gan vao request nay - doi truoc neu can.
 *
 * Doi CHU DONG khi sap het han, thay vi doi toi luc an 401 roi thu lai. Ly do
 * khong phai gon hon ma la it duong hon: mot request POST /transfers bi 401 roi
 * thu lai la mot lenh chuyen tien duoc gui HAI LAN. Idempotency-Key che duoc,
 * nhung khong dua vao no thi tot hon.
 */
async function freshToken() {
  const session = readSession()
  if (!session) return null
  if (isAccessTokenFresh(session)) return session.token

  return refreshOnce()
}

export async function api(path, { skipAuth = false, ...options } = {}) {
  // DUNG MOT CHO gan token cho moi request. Doi cach xac thuc thi sua o day,
  // khong phai di tim tung cho goi API.
  //
  // skipAuth cho /login va /register: chung KHONG can token, va neu con mot phien
  // cu da het han thi goi freshToken() se di doi token truoc khi dang nhap -
  // mot vong goi mang vo nghia, va no co the that bai roi keo theo ca lan dang
  // nhap that bai.
  let token = null
  if (!skipAuth) {
    try {
      token = await freshToken()
    } catch {
      // Doi token that bai: refresh token het han, bi thu hoi, hoac ca chuoi vua
      // bi giet. Khong con duong nao ngoai dang nhap lai.
      //
      // TU xoa phien o day, khong cho onSessionExpired() lam ho. Handler do la
      // de giao dien PHAN UNG (dieu huong ve /login); con viec phien nay da chet
      // thi tang nay biet chac chan, va biet truoc. Trong cay vao mot handler co
      // duoc dang ky hay khong la de mot phien chet nam lai trong localStorage.
      clearSession()
      onSessionExpired()
      throw new ApiError({ code: 'SESSION_EXPIRED' }, 401)
    }
  }

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
    skipAuth: true,
    body: JSON.stringify({ email, password, fullName }),
  })

export const login = (email, password) =>
  api('/api/auth/login', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ email, password }),
  })

/**
 * Dang xuat THAT SU - thu hoi refresh token o phia server.
 *
 * Truoc day "dang xuat" chi la vut token o client, nghia la ai da sao chep no ra
 * van dung tiep duoc het han. Gio refresh token chet han tren server, va ke do
 * chi con dung duoc toi khi access token het - toi da 15 phut.
 *
 * Tra ve 204, khong co body.
 */
export const logout = () => api('/api/auth/logout', { method: 'POST' })

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
