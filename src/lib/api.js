// Vite chi day ra trinh duyet nhung bien bat dau bang VITE_.
// Moi thu co tien to VITE_ deu la CONG KHAI - ai mo DevTools cung doc duoc.
const BASE_URL = import.meta.env.VITE_API_URL

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
  let response
  try {
    response = await fetch(BASE_URL + path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    })
  } catch (error) {
    // fetch CHI nem loi khi mang chet. 4xx/5xx thi no van resolve binh thuong,
    // nen khong the dua vao try/catch de biet request that bai.
    if (error.name === 'AbortError') throw error
    throw new NetworkError(error)
  }

  const body = response.status === 204 ? null : await response.json().catch(() => null)

  if (!response.ok) throw new ApiError(body, response.status)
  return body
}

// === Cac loi goi cu the ===
// Gom o day de component khong phai nho duong dan, va doi duong dan thi sua mot cho.

export const getWallet = (walletId, options) => api(`/api/wallets/${walletId}`, options)

export const getTransactions = (walletId, limit = 20, options) =>
  api(`/api/wallets/${walletId}/transactions?limit=${limit}`, options)

export const deposit = (walletId, amount) =>
  api(`/api/wallets/${walletId}/deposits`, {
    method: 'POST',
    body: JSON.stringify({ amount: Number(amount) }),
  })

export const transfer = (fromWalletId, toWalletId, amount) =>
  api('/api/transfers', {
    method: 'POST',
    body: JSON.stringify({
      fromWalletId: Number(fromWalletId),
      toWalletId: Number(toWalletId),
      amount: Number(amount),
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
