import { call, put, takeLeading } from 'redux-saga/effects'
import { groupFieldErrors, login, logout, register } from '../lib/api'
import { clearSession, saveSession } from '../lib/session'
import {
  authFailed,
  authSucceeded,
  sessionCleared,
  signInRequested,
  signOutRequested,
  signUpRequested,
} from './authSlice'

/**
 * Doi loi cua API sang thu giao dien hien ra duoc.
 *
 * <p>Re nhanh theo `code`, KHONG BAO GIO theo `message`: message la chu tieng
 * Viet cho nguoi dung doc va co the doi bat cu luc nao, code la hop dong.
 *
 * <p>Gom ca hai man vao mot ham duoc vi cac code khong dam nhau -
 * INVALID_CREDENTIALS chi den tu /login, EMAIL_ALREADY_USED chi den tu /register.
 */
function toAuthError(error) {
  // Mot thong bao DUY NHAT cho ca hai truong hop sai email va sai mat khau.
  // Tach ra la tiet lo email nao ton tai trong he thong - vo ich cho nguoi
  // dung, huu ich cho ke tan cong.
  if (error.code === 'INVALID_CREDENTIALS') {
    return { formError: 'Email hoặc mật khẩu không đúng' }
  }

  // Dat DUOI o email chu khong phai loi toan form: nguoi dung sua duoc ngay o
  // dung cho, va o kia moi la cho sai.
  if (error.code === 'EMAIL_ALREADY_USED') {
    return { fieldErrors: { email: ['Email này đã được dùng'] } }
  }

  if (error.code === 'VALIDATION_FAILED') {
    return { fieldErrors: groupFieldErrors(error.fieldErrors) }
  }

  return { formError: error.message }
}

function* signInSaga({ payload: { email, password } }) {
  try {
    const data = yield call(login, email, password)
    yield put(authSucceeded(saveSession(data)))
  } catch (error) {
    yield put(authFailed(toAuthError(error)))
  }
}

function* signUpSaga({ payload: { email, password, fullName } }) {
  try {
    // Backend tra token luon sau khi dang ky, khong bat dang nhap lai.
    const data = yield call(register, email, password, fullName)
    yield put(authSucceeded(saveSession(data)))
  } catch (error) {
    yield put(authFailed(toAuthError(error)))
  }
}

function* signOutSaga() {
  // Bao server thu hoi refresh token TRUOC, roi moi xoa o client.
  //
  // Truoc day "dang xuat" chi la vut token o client, nghia la ai da sao chep
  // no ra van dung tiep duoc het han. Gio refresh token chet han tren server.
  //
  // Nuot loi co y: dang xuat phai LUON thanh cong o phia nguoi dung. Mat mang
  // hay server chet ma khong cho ra man dang nhap la mot cach lam nguoi ta
  // hoang. Doi lai: refresh token khong bi thu hoi - chap nhan, vi truong hop
  // do dung bang hanh vi cu.
  try {
    yield call(logout)
  } catch {
    // khong lam gi - xem tren
  }

  clearSession()
  yield put(sessionCleared())
}

/**
 * ⭐ takeLeading, KHONG phai takeEvery.
 *
 * <p>takeEvery: bam dup nut "Đăng nhập" -> HAI request /api/auth/login. Ca hai
 * deu thanh cong, ca hai deu goi saveSession, va refresh token cua lan dau bi
 * ghi de mat - no nam lai tren server o trang thai con song ma khong ai giu.
 *
 * <p>takeLeading: lan bam dau tien duoc chay, moi lan bam trong luc no chua
 * xong deu bi BO QUA. Dung mot lenh dang nhap tai mot thoi diem.
 *
 * <p>Cung mot y voi refreshOnce() trong http.js, khac cho dat: refresh phai
 * chay o tang HTTP vi no xay ra giua chung mot request nao do, con dang
 * nhap/dang xuat la hanh dong NGUOI DUNG BAM nen saga nghe duoc.
 */
export default function* rootSaga() {
  yield takeLeading(signInRequested.type, signInSaga)
  yield takeLeading(signUpRequested.type, signUpSaga)
  yield takeLeading(signOutRequested.type, signOutSaga)
}
