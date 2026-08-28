import { http } from './http'

// Giu nguyen duong import cu cho ca app: cac cho khac van `import { ApiError }
// from './api'` nhu truoc, khong phai biet rang chung vua doi sang errors.js.
export { ApiError, NetworkError } from './errors'
export { setSessionExpiredHandler } from './http'

/**
 * Goi API va tra ve THAN response, khong phai ca doi tuong axios.
 *
 * <p>Component khong quan tam toi `response.data` - chung muon cai vi, cai danh
 * sach giao dich. Boc mot lop mong o day de cho nao goi cung chi thay du lieu.
 *
 * @param path duong dan, vi du '/api/wallets/1'
 * @param config cau hinh axios, cong them `skipAuth` cho endpoint khong can token
 */
export async function api(path, config = {}) {
  const response = await http.request({ url: path, method: 'GET', ...config })

  // 204 khong co than. axios dua ve chuoi rong chu khong phai null, ma chuoi
  // rong la mot GIA TRI - de nguyen thi cho goi phai di kiem `data === ''`.
  return response.status === 204 || response.data === '' ? null : response.data
}

// === Cac loi goi cu the ===
// Gom o day de component khong phai nho duong dan, va doi duong dan thi sua mot cho.

/**
 * Ca hai tra ve AuthResponse: { token, refreshToken, expiresInSeconds, walletId, fullName }.
 *
 * <p>register tra 201 chu khong phai 200 - mot nguoi dung va mot vi vua duoc
 * TAO RA. axios khong phan biet 200 voi 201, ca hai deu qua duoc validateStatus.
 */
export const register = (email, password, fullName) =>
  api('/api/auth/register', {
    method: 'POST',
    skipAuth: true,
    data: { email, password, fullName },
  })

export const login = (email, password) =>
  api('/api/auth/login', {
    method: 'POST',
    skipAuth: true,
    data: { email, password },
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

export const getWallet = (walletId, config) => api(`/api/wallets/${walletId}`, config)

export const getTransactions = (walletId, limit = 20, config) =>
  api(`/api/wallets/${walletId}/transactions?limit=${limit}`, config)

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
 * <p>⚠️ Doi sang axios KHONG lam thay doi dieu nay: axios goi JSON.stringify len
 * object duoi day, va mot CHUOI nam trong object van di ra day nguyen ven. Cho
 * chet nguoi van la `String(amount)` - doi no thanh Number(amount) thi so tien
 * hong tu day, truoc ca khi axios kip nhin thay.
 *
 * ID vi thi van de Number: chung la `long` va la so nguyen nho, khong co gi de mat.
 */
export const deposit = (walletId, amount) =>
  api(`/api/wallets/${walletId}/deposits`, {
    method: 'POST',
    data: { amount: String(amount).trim() },
  })

export const transfer = (fromWalletId, toWalletId, amount) =>
  api('/api/transfers', {
    method: 'POST',
    data: {
      fromWalletId: Number(fromWalletId),
      toWalletId: Number(toWalletId),
      amount: String(amount).trim(),
    },
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
