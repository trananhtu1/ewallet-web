import { useCallback, useEffect, useMemo, useState } from 'react'
import * as apiClient from '../lib/api'
import { clearSession, readSession, saveSession } from '../lib/session'
import { AuthContext } from './authContext'

export function AuthProvider({ children }) {
  // Doc localStorage NGAY trong initializer, khong phai trong useEffect. Neu doi
  // effect thi lan render dau session van la null -> RequireAuth day nguoi dung
  // ve /login roi moi keo nguoc lai. Man hinh nhay mot cai moi lan tai trang.
  const [session, setSession] = useState(readSession)

  useEffect(() => {
    // Token het han giua chung: api() goi vao day. Xoa phien la du - RequireAuth
    // thay session null se tu dieu huong, khong can goi navigate() o day.
    apiClient.setSessionExpiredHandler(() => {
      clearSession()
      setSession(null)
    })

    return () => apiClient.setSessionExpiredHandler(() => {})
  }, [])

  const signIn = useCallback(async (email, password) => {
    setSession(saveSession(await apiClient.login(email, password)))
  }, [])

  const signUp = useCallback(async (email, password, fullName) => {
    // Backend tra token luon sau khi dang ky, khong bat dang nhap lai.
    setSession(saveSession(await apiClient.register(email, password, fullName)))
  }, [])

  const signOut = useCallback(() => {
    // Khong co POST /api/auth/logout: JWT la stateless, server khong giu phien
    // nao de xoa. Dang xuat = vut token o phia client.
    clearSession()
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({ session, signIn, signUp, signOut }),
    [session, signIn, signUp, signOut],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
