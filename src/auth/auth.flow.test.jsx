import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { saveSession } from '../lib/session'
import { reply, restoreAdapter, routeAdapter } from '../test/axiosMock'
import { AuthProvider } from './AuthProvider'

function renderApp(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
}

const AUTH_OK = reply(200, {
  token: 'token-abc',
  refreshToken: 'rt-token-abc',
  expiresInSeconds: 7200,
  walletId: 4,
  fullName: 'Richard Tran',
})

const WALLET_OK = reply(200, { id: 4, userId: 1, balance: '250000.50', version: 0 })
const NO_TRANSACTIONS = reply(200, [])

beforeEach(() => localStorage.clear())
afterEach(restoreAdapter)

describe('cong chan route', () => {
  it('chua dang nhap thi vao / se thay man dang nhap', async () => {
    routeAdapter({})
    renderApp('/')

    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
  })

  it('da dang nhap thi vao / thay thang man vi', async () => {
    saveSession({ token: 'token-abc', refreshToken: 'rt-token-abc', expiresInSeconds: 7200, walletId: 4, fullName: 'Richard Tran' })
    routeAdapter({ '/api/wallets/4/transactions': NO_TRANSACTIONS, '/api/wallets/4': WALLET_OK })

    renderApp('/')

    expect(await screen.findByText('250.000,50 đ')).toBeInTheDocument()
    expect(screen.getByText(/Richard Tran/)).toBeInTheDocument()
  })

  it('da dang nhap ma vao /login thi bi day ve man vi', async () => {
    saveSession({ token: 'token-abc', refreshToken: 'rt-token-abc', expiresInSeconds: 7200, walletId: 4, fullName: 'Richard Tran' })
    routeAdapter({ '/api/wallets/4/transactions': NO_TRANSACTIONS, '/api/wallets/4': WALLET_OK })

    renderApp('/login')

    expect(await screen.findByText('250.000,50 đ')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Đăng nhập' })).not.toBeInTheDocument()
  })
})

describe('dang nhap', () => {
  function fillLogin(email, password) {
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } })
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: password } })
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))
  }

  it('dang nhap dung thi vao thang man vi', async () => {
    routeAdapter({
      '/api/auth/login': AUTH_OK,
      '/api/wallets/4/transactions': NO_TRANSACTIONS,
      '/api/wallets/4': WALLET_OK,
    })
    renderApp('/login')

    fillLogin('anh@vieted.com', 'matkhau12345')

    expect(await screen.findByText('250.000,50 đ')).toBeInTheDocument()
  })

  it('token duoc luu lai de tai trang khong phai dang nhap lai', async () => {
    routeAdapter({
      '/api/auth/login': AUTH_OK,
      '/api/wallets/4/transactions': NO_TRANSACTIONS,
      '/api/wallets/4': WALLET_OK,
    })
    renderApp('/login')

    fillLogin('anh@vieted.com', 'matkhau12345')
    await screen.findByText('250.000,50 đ')

    expect(JSON.parse(localStorage.getItem('ewallet.session')).token).toBe('token-abc')
  })

  /**
   * INVALID_CREDENTIALS co y KHONG phan biet sai email voi sai mat khau. Test nay
   * canh giu dieu do: chi can mot ai do "cai thien trai nghiem" bang cach bao
   * "email khong ton tai" la ho vua tang ke tan cong cong cu do email co that.
   */
  it('sai mat khau: mot thong bao chung, khong tiet lo email co ton tai hay khong', async () => {
    routeAdapter({
      '/api/auth/login': reply(401, {
        status: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Email hoặc mật khẩu không đúng',
      }),
    })
    renderApp('/login')

    fillLogin('anh@vieted.com', 'sai-mat-khau')

    expect(await screen.findByText('Email hoặc mật khẩu không đúng')).toBeInTheDocument()
    expect(screen.queryByText(/không tồn tại/i)).not.toBeInTheDocument()
    // Van o lai man dang nhap, va khong luu gi ca.
    expect(localStorage.getItem('ewallet.session')).toBeNull()
  })

  it('backend chet thi bao loi mang chu khong treo im lang', async () => {
    routeAdapter({})
    renderApp('/login')

    fillLogin('anh@vieted.com', 'matkhau12345')

    expect(await screen.findByText('Không kết nối được tới máy chủ')).toBeInTheDocument()
  })
})

describe('dang xuat', () => {
  it('bam dang xuat thi ve man dang nhap va xoa token', async () => {
    saveSession({ token: 'token-abc', refreshToken: 'rt-token-abc', expiresInSeconds: 7200, walletId: 4, fullName: 'Richard Tran' })
    routeAdapter({ '/api/wallets/4/transactions': NO_TRANSACTIONS, '/api/wallets/4': WALLET_OK })

    renderApp('/')
    await screen.findByText('250.000,50 đ')

    fireEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
    })
    expect(localStorage.getItem('ewallet.session')).toBeNull()
  })
})
