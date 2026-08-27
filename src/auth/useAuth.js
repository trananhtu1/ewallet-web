import { useContext } from 'react'
import { AuthContext } from './authContext'

export function useAuth() {
  const value = useContext(AuthContext)

  // Vo ngay voi ten dung cho, thay vi de component doc `session` cua undefined
  // va bao mot loi chang lien quan gi toi nguyen nhan.
  if (!value) throw new Error('useAuth phải nằm trong <AuthProvider>')

  return value
}
