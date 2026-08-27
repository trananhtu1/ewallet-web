import { Navigate, useLocation } from 'react-router'
import { useAuth } from './useAuth'

/**
 * Cong chan cho cac route can dang nhap.
 *
 * <p>Day KHONG phai lop bao mat - ai cung sua duoc JavaScript trong trinh duyet.
 * Thu chan that la backend: token sai thi 401, khong quan man hinh nao hien ra.
 * Cho nay chi de nguoi dung khong nhin thay mot trang trong rong.
 */
export default function RequireAuth({ children }) {
  const { session } = useAuth()
  const location = useLocation()

  if (!session) {
    // Nho lai trang dang dinh vao. Dang nhap xong quay dung cho do, khong phai
    // luc nao cung nem ve trang chu.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
