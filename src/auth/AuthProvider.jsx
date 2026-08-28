import { useEffect, useState } from 'react'
import { Provider, useDispatch } from 'react-redux'
import { setSessionExpiredHandler } from '../lib/api'
import { clearSession } from '../lib/session'
import { makeStore } from '../store'
import { sessionCleared } from '../store/authSlice'

/**
 * Cam Redux store vao cay component.
 *
 * <p>Ten cu duoc giu lai co y: cho nao dang boc <AuthProvider> khong phai sua
 * gi, va cai ten van dung - no van la thu quyet dinh "app nay biet ai dang
 * dang nhap".
 *
 * <p>Store dung MOI LAN MOUNT chu khong phai mot singleton import tu ngoai:
 * moi lan render trong test can mot store sach, neu khong thi phien cua test
 * truoc con nam lai trong store cua test sau va loi hien ra o mot cho chang
 * lien quan gi toi nguyen nhan. App that mount dung mot lan nen khong mat gi.
 */
export function AuthProvider({ children }) {
  const [store] = useState(makeStore)

  return (
    <Provider store={store}>
      <SessionExpiryBridge />
      {children}
    </Provider>
  )
}

/**
 * Noi tang HTTP voi store.
 *
 * <p>http.js khong duoc phep biet gi ve Redux hay React - biet thi khong test
 * noi no bang Node. Nen no bao ra bang mot callback, va cho nay la cho duy
 * nhat doi callback do thanh mot action.
 *
 * <p>Khong render gi ca: no la day dien, khong phai giao dien.
 */
function SessionExpiryBridge() {
  const dispatch = useDispatch()

  useEffect(() => {
    // Token het han giua chung: interceptor cua axios goi vao day. Xoa phien
    // la du - RequireAuth thay session null se tu dieu huong, khong can goi
    // navigate() o day.
    setSessionExpiredHandler(() => {
      clearSession()
      dispatch(sessionCleared())
    })

    return () => setSessionExpiredHandler(() => {})
  }, [dispatch])

  return null
}
