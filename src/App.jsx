import { Navigate, Route, Routes } from 'react-router'
import RequireAuth from './auth/RequireAuth'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import WalletPage from './pages/WalletPage'

/**
 * Khung dieu huong.
 *
 * <p>Co dinh tuyen o day thi `vercel.json` moi thuc su can den: quy tac rewrites
 * dua MOI duong dan ve index.html. Thieu no, vao thang /login roi F5 se ra 404 -
 * Vercel di tim mot file ten /login khong co that, trong khi routing do React xu
 * ly o phia trinh duyet.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <WalletPage />
          </RequireAuth>
        }
      />

      {/* Duong dan la -> ve trang chu, va RequireAuth quyet dinh tiep. Khong de
          nguoi dung nhin mot trang trang khong noi gi. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
