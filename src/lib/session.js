// MOT cho duy nhat biet "phien dang nhap hien tai la ai".
//
// Truoc khi co auth, file nay chi giu walletId doc tu localStorage. Gio no giu
// ca phien: token, walletId, ten. Cac cho khac KHONG doc localStorage truc tiep
// - doi cach luu (vi du sang cookie) thi chi file nay phai sua.

const STORAGE_KEY = 'ewallet.session'

/**
 * Tru hao 10 giay truoc han that.
 *
 * Dong ho may nguoi dung khong khop dong ho server, va mot request van mat thoi
 * gian tren duong. Token con dung 2 giay thi gui di gan nhu chac chan an 401 -
 * coi nhu het han som mot chut de nguoi dung thay man dang nhap tu te, thay vi
 * mot loi lung giua chung.
 */
const EXPIRY_SAFETY_MS = 10_000

/**
 * Doc phien dang luu. Tra ve null neu chua dang nhap HOAC token da het han.
 *
 * `expiresInSeconds` co trong AuthResponse chinh la de lam viec nay: biet truoc
 * khi nao phai dang nhap lai, thay vi doi toi luc an 401 giua mot thao tac.
 */
export function readSession() {
  let raw
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    // Trinh duyet chan localStorage (che do rieng tu o mot so cau hinh).
    return null
  }
  if (!raw) return null

  let session
  try {
    session = JSON.parse(raw)
  } catch {
    // Du lieu hong - coi nhu chua dang nhap con hon de app vo o cho khac.
    clearSession()
    return null
  }

  if (!session?.token || Date.now() >= session.expiresAt - EXPIRY_SAFETY_MS) {
    clearSession()
    return null
  }

  return session
}

/** Nhan nguyen AuthResponse tu POST /api/auth/login hoac /register. */
export function saveSession({ token, expiresInSeconds, walletId, fullName }) {
  const session = {
    token,
    walletId,
    fullName,
    // Luu MOC HET HAN chu khong luu so giay con lai: so giay con lai tinh tu
    // luc nao? Sau khi tai lai trang thi khong ai biet nua.
    expiresAt: Date.now() + expiresInSeconds * 1000,
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Het dung luong hoac bi chan: van tra ve session de phien nay dung duoc,
    // chi la tai lai trang thi phai dang nhap lai.
  }

  return session
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Khong lam gi duoc, va cung khong dang de vo app.
  }
}

/** Token de gan vao header Authorization. null khi chua dang nhap. */
export function authToken() {
  return readSession()?.token ?? null
}

/**
 * Vi dang xem la vi nao.
 *
 * Backend chua co /api/wallets/me nen id van di tren URL - nhung id gio den tu
 * AuthResponse chu khong con la so 1 doan bua. Khi /me co roi thi cac cho goi
 * ham nay se bo dan, va bo het thi xoa ham.
 */
export function currentWalletId() {
  return readSession()?.walletId ?? null
}
