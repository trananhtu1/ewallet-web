import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { Toaster } from 'sonner'
import App from './App.jsx'
import { AuthProvider } from './auth/AuthProvider'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter NGOAI AuthProvider: RequireAuth goi <Navigate> nen no phai
        nam trong pham vi cua router. Dao thu tu lai se vo luc dieu huong. */}
    <BrowserRouter>
      <AuthProvider>
        <App />

        {/* Bao "da nap xong" o day chu khong nhet them mot dong <p> vao form:
            tien da chay roi, form da trong lai, va thu nguoi dung can la mot
            xac nhan ngan roi bien di - khong phai mot dong chu nam mai o do.
            richColors cho toast thanh cong mau xanh thay vi xam nhat. */}
        <Toaster richColors position="top-center" />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
