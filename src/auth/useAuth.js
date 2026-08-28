import { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  authErrorsCleared,
  selectAuthBusy,
  selectAuthFieldErrors,
  selectAuthFormError,
  selectSession,
  signInRequested,
  signOutRequested,
  signUpRequested,
} from '../store/authSlice'

/**
 * Cua duy nhat de component cham vao chuyen dang nhap.
 *
 * <p>Giu lai ten cu de cho nao goi khong phai sua, nhung ben trong da doi han:
 * truoc day signIn() la mot Promise nem loi ra cho component bat, gio no chi
 * DISPATCH mot action roi tra ve ngay. Ket qua di nguoc lai qua store -
 * `busy`, `formError`, `fieldErrors`.
 *
 * <p>Doi nhu vay duoc gi: bam dup nut "Đăng nhập" khong con goi hai request
 * (takeLeading trong authSaga.js lo), va loi khong con nam trong state rieng
 * cua tung man - chung o mot cho, thay duoc trong Redux DevTools.
 */
export function useAuth() {
  const dispatch = useDispatch()

  const session = useSelector(selectSession)
  const busy = useSelector(selectAuthBusy)
  const formError = useSelector(selectAuthFormError)
  const fieldErrors = useSelector(selectAuthFieldErrors)

  return useMemo(
    () => ({
      session,
      busy,
      formError,
      fieldErrors,

      signIn: (email, password) => dispatch(signInRequested({ email, password })),
      signUp: (email, password, fullName) =>
        dispatch(signUpRequested({ email, password, fullName })),
      signOut: () => dispatch(signOutRequested()),

      // Nguoi dung bat dau go lai sau khi sai: don loi cu di cho do vuong mat.
      clearAuthErrors: () => dispatch(authErrorsCleared()),
    }),
    [session, busy, formError, fieldErrors, dispatch],
  )
}
