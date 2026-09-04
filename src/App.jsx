import { Navigate, Route, Routes } from 'react-router'
import RequireAuth from './auth/RequireAuth'
import AppShell from './components/AppShell'
import HistoryPage from './pages/HistoryPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import StatementPage from './pages/StatementPage'
import RegisterPage from './pages/RegisterPage'
import TransferPage from './pages/TransferPage'

/**
 * Khung dieu huong.
 *
 * <p>⭐ Bon tuyen trong AppShell thay cho MOT trang duy nhat truoc day. Sau khi
 * lo them ba tinh nang da co san, trang do dai gan hai man hinh va khong con
 * cho nao la "cho quan trong nhat".
 *
 * <p>`AppShell` la <b>layout route</b>: no boc RequireAuth mot lan cho ca bon
 * tab, thay vi lap lai o tung tuyen. Bon lan viet cung mot thu bao ve la bon co
 * hoi quen mot lan.
 *
 * <p>Co dinh tuyen o day thi `vercel.json` moi thuc su can den: quy tac rewrites
 * dua MOI duong dan ve index.html. Thieu no, vao thang /lich-su roi F5 se ra 404
 * - Vercel di tim mot file ten /lich-su khong co that, trong khi routing do
 * React xu ly o phia trinh duyet.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/chuyen-tien" element={<TransferPage />} />
        <Route path="/lich-su" element={<HistoryPage />} />
        <Route path="/sao-ke" element={<StatementPage />} />
        <Route path="/ca-nhan" element={<ProfilePage />} />
      </Route>

      {/* Duong dan la -> ve trang chu, va RequireAuth quyet dinh tiep. Khong de
          nguoi dung nhin mot trang trang khong noi gi. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
