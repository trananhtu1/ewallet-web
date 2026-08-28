import { createSlice } from '@reduxjs/toolkit'
import { readSession } from '../lib/session'

/**
 * Phien dang nhap - mieng CLIENT STATE that su duy nhat cua app.
 *
 * <p>Moi thu con lai (vi, lich su giao dich) la SERVER STATE va thuoc ve
 * walletApi/RTK Query. Tach hai loai nay ra la ly do store nay be den vay:
 * nhoi du lieu server vao slice thi phai tu viet lai cache, dedupe va
 * invalidate - dung nhung thu RTK Query da lam san.
 */
/**
 * ⚠️ Phai la HAM, khong duoc la mot object hang.
 *
 * <p>Mot object hang se goi readSession() DUNG MOT LAN, luc module duoc import.
 * App that thi khong sao - no import roi mount ngay. Nhung trong test, module
 * duoc nap tu truoc khi test dau tien kip ghi gi vao localStorage, nen moi
 * store sinh ra sau do deu mang cai anh chup rong tu luc nap.
 *
 * <p>Da do that: ba test "da dang nhap thi vao / thay man vi" cung ngo ra man
 * dang nhap, va loi hien ra o RequireAuth - cach nguyen nhan that ba tang.
 */
export function initialAuthState() {
  return {
    // Doc localStorage NGAY luc dung state ban dau, khong phai trong useEffect.
    // Neu doi effect thi lan render dau session van la null -> RequireAuth day
    // nguoi dung ve /login roi moi keo nguoc lai. Man hinh nhay mot cai moi lan
    // tai trang.
    session: readSession(),

    // 'pending' trong luc dang goi mang. Dung mot chuoi chu khong phai boolean
    // `busy` de sau nay them trang thai moi khong phai doi kieu du lieu.
    status: 'idle',

    // Loi o muc FORM: sai mat khau, mat mang. Khong gan duoc vao o nhap nao.
    formError: null,

    // Loi theo tung o nhap: { email: ['...'], password: ['...'] }.
    // LUON la mang cho moi field - mot field co the truot nhieu luat cung luc.
    fieldErrors: {},
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState(),
  reducers: {
    // === Ba action nguoi dung bam. Saga lang nghe chung, reducer chi don cho. ===
    signInRequested: startRequest,
    signUpRequested: startRequest,
    signOutRequested: startRequest,

    /** Saga bao: da co phien. `payload` la session DA luu xuong localStorage. */
    authSucceeded(state, action) {
      state.session = action.payload
      state.status = 'idle'
      state.formError = null
      state.fieldErrors = {}
    },

    /** Saga bao: that bai, va da doi loi API sang ngon ngu cua giao dien. */
    authFailed(state, action) {
      state.status = 'idle'
      state.formError = action.payload.formError ?? null
      state.fieldErrors = action.payload.fieldErrors ?? {}
    },

    /** Dang xuat xong, HOAC token het han giua chung. Ket qua giong nhau. */
    sessionCleared(state) {
      state.session = null
      state.status = 'idle'
      state.formError = null
      state.fieldErrors = {}
    },

    /** Nguoi dung bat dau go lai - don loi cu di cho do vuong mat. */
    authErrorsCleared(state) {
      state.formError = null
      state.fieldErrors = {}
    },
  },
})

/**
 * Ba action bat dau request deu don dep giong het nhau, nen dung chung mot
 * reducer. Viet ba lan la mo duong cho ba lan phan ky ve sau.
 */
function startRequest(state) {
  state.status = 'pending'
  state.formError = null
  state.fieldErrors = {}
}

export const {
  signInRequested,
  signUpRequested,
  signOutRequested,
  authSucceeded,
  authFailed,
  sessionCleared,
  authErrorsCleared,
} = authSlice.actions

export const selectSession = (state) => state.auth.session
export const selectAuthBusy = (state) => state.auth.status === 'pending'
export const selectAuthFormError = (state) => state.auth.formError
export const selectAuthFieldErrors = (state) => state.auth.fieldErrors

export default authSlice.reducer
