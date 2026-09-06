import axios from 'axios'
import { ApiError, NetworkError } from './errors'
import { clearSession, isAccessTokenFresh, readSession, saveSession } from './session'

// Vite chi day ra trinh duyet nhung bien bat dau bang VITE_.
// Moi thu co tien to VITE_ deu la CONG KHAI - ai mo DevTools cung doc duoc.
const BASE_URL = import.meta.env.VITE_API_URL

/**
 * ⚠️⚠️ KHONG dat `Content-Type: application/json` lam header MAC DINH o day.
 *
 * <p>Dong do tung nam o ngay cho nay va no lam CHET moi lan upload file. Axios
 * doc header truoc khi doc du lieu - trong `transformRequest`:
 *
 * <pre>
 *   const hasJSONContentType = contentType.indexOf('application/json') > -1
 *   if (isFormData) return hasJSONContentType ? JSON.stringify(formDataToJSON(data)) : data
 * </pre>
 *
 * Nghia la mot `FormData` chua tam anh bi <b>am tham doi thanh JSON</b>. Do
 * duoc: than request that su di ra day la <code>{"file":{}}</code> - ba byte
 * anh bien mat, vi `JSON.stringify` mot `Blob` ra doi ngoac rong.
 *
 * <p>Khong co loi nao o trinh duyet, va cung khong co gi de nhin trong tab
 * Network ngoai mot request "da gui" - nen no doc ra giong het "khong goi duoc
 * API". Phia Spring thi `@RequestParam("file") MultipartFile` khong co gi de
 * lay: request nay khong phai multipart.
 *
 * <p>Bo dong do di thi axios tu chon dung header cho tung loai than:
 *
 * <pre>
 *   object thuong  ->  application/json                       (tu dat)
 *   FormData       ->  multipart/form-data; boundary=...      (trinh duyet dat)
 *   GET khong than ->  khong co Content-Type                  (dung vay)
 * </pre>
 *
 * 📌 Bai hoc: mot mac dinh dat o tang duoi cung co the vo hieu hoa mot quy tac
 * viet dung o tang tren. `walletApi.js` co han hai dong ghi chu "KHONG dat
 * Content-Type bang tay" - va chung deu dung, nhung dong nay dat ho chung.
 *
 * <p>MOT axios instance cho ca app: interceptor gan vao instance rieng thi
 * khong ro ri sang thu vien khac cung dung axios, va test co the thay
 * `http.defaults.adapter` ma khong dung toi trang thai toan cuc.
 */
export const http = axios.create({ baseURL: BASE_URL })

/**
 * Duoc goi khi token HET HAN giua chung (server tra 401 cho mot request DA co
 * token). Saga auth dang ky ham nay de xoa phien, roi RequireAuth tu day
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
 * ⭐ CHO DE TU BAN VAO CHAN NHAT CA FILE, va no o day chu khong o backend.
 *
 * Backend xoay vong refresh token: moi cai dung duoc DUNG MOT LAN, va neu mot
 * token da dung duoc trinh ra lan nua thi no coi do la bang chung co hai ban sao
 * -> THU HOI CA CHUOI, nguoi dung bi da ra.
 *
 * Ma WalletPage goi hai request SONG SONG. Neu ca hai cung thay token het han va
 * cung goi /refresh voi cung mot refresh token thi chinh client tu kich hoat co
 * che do. Da do that tren backend:
 *
 *   request 1 -> 200
 *   request 2 -> 401
 *   audit_log -> REFRESH_TOKEN_REUSED, detectedBy CONCURRENT_CLAIM, revokedCount 2
 *
 * Nen: MOT lan doi token tai mot thoi diem. Cac loi goi den sau bam vao dung
 * cai Promise dang chay thay vi mo them mot lan doi nua.
 *
 * <p>Day cung la ly do redux-saga KHONG duoc giao viec doi token: refresh phai
 * chay o tang HTTP, truoc khi request roi may. Saga chi biet toi cac hanh dong
 * nguoi dung bam (dang nhap, dang xuat) - xem src/store/authSaga.js.
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

  // skipAuth: BAT BUOC. Thieu no thi request interceptor duoi day lai di kiem
  // token cho chinh lan doi token nay - mot vong lap khong loi thoat.
  const { data } = await http.post(
    '/api/auth/refresh',
    { refreshToken: session.refreshToken },
    { skipAuth: true },
  )

  return saveSession(data).token
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

/**
 * DUNG MOT CHO gan token cho moi request. Doi cach xac thuc thi sua o day,
 * khong phai di tim tung cho goi API.
 *
 * <p>`skipAuth` cho /login, /register va /refresh: chung KHONG can token, va neu
 * con mot phien cu da het han thi goi freshToken() se di doi token truoc khi
 * dang nhap - mot vong goi mang vo nghia, va no co the that bai roi keo theo ca
 * lan dang nhap that bai.
 */
http.interceptors.request.use(async (config) => {
  if (config.skipAuth) return config

  let token
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

  if (token) config.headers.Authorization = `Bearer ${token}`

  // Danh dau de interceptor response phan biet duoc hai loai 401 - xem duoi.
  config.hadToken = Boolean(token)

  return config
})

/**
 * Doi moi that bai cua axios sang DUNG HAI kieu loi cua app.
 *
 * <p>Component chi phai biet ApiError va NetworkError, khong phai hoc thuoc
 * hinh dang cua AxiosError (`error.response?.data` hay `error.request`).
 */
http.interceptors.response.use(
  (response) => response,
  (error) => {
    // Loi da duoc interceptor request nem ra roi - dung boc them mot lop nua.
    if (error instanceof ApiError || error instanceof NetworkError) throw error

    // Huy request KHONG phai that bai. Giu ten 'AbortError' vi do la hop dong
    // cu ca app dang dua vao, khong phai 'CanceledError' rieng cua axios.
    if (axios.isCancel(error)) {
      const aborted = new Error('Request bị hủy')
      aborted.name = 'AbortError'
      throw aborted
    }

    // Co `response` = server DA tra loi, chi la tra ve loi. Khac han mang chet.
    if (error.response) {
      const { status, data } = error.response

      // 401 CO token = phien het han giua chung -> dang xuat.
      // 401 KHONG co token = dang nhap sai mat khau -> tuyet doi khong dang xuat,
      // khong thi man dang nhap se tu da chinh no moi lan go sai.
      if (status === 401 && error.config?.hadToken) onSessionExpired()

      // Response loi co the KHONG phai JSON - vi du that: Render tra ve trang
      // HTML 502 luc service dang khoi dong lai. Luc do `data` la chuoi, va
      // ApiError se roi ve code UNKNOWN cung thong bao mac dinh.
      throw new ApiError(data && typeof data === 'object' ? data : null, status)
    }

    throw new NetworkError(error)
  },
)
