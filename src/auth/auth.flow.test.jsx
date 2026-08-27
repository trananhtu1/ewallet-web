import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { saveSession } from '../lib/session'
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

/** Tra loi theo tung URL, giong backend that hon la mot response duy nhat. */
function routeFetch(handlers) {
  const fetchMock = vi.fn(async (url) => {
    const match = Object.keys(handlers).find((key) => String(url).includes(key))
    if (!match) throw new TypeError('Failed to fetch')
    return handlers[match]()
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const json = (status, body) => () => ({ ok: status < 400, status, json: async () => body })

const AUTH_OK = json(200, {
  token: 'token-abc',
  expiresInSeconds: 7200,
  walletId: 4,
  fullName: 'Richard Tran',
})

const WALLET_OK = json(200, { id: 4, userId: 1, balance: '250000.50', version: 0 })
const NO_TRANSACTIONS = json(200, [])

beforeEach(() => localStorage.clear())
afterEach(() => vi.unstubAllGlobals())

describe('cong chan route', () => {
  it('chua dang nhap thi vao / se thay man dang nhap', async () => {
    routeFetch({})
    renderApp('/')

    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
  })

  it('da dang nhap thi vao / thay thang man vi', async () => {
    saveSession({ token: 'token-abc', expiresInSeconds: 7200, walletId: 4, fullName: 'Richard Tran' })
    routeFetch({ '/api/wallets/4/transactions': NO_TRANSACTIONS, '/api/wallets/4': WALLET_OK })

    renderApp('/')

    expect(await screen.findByText('250.000,50 đ')).toBeInTheDocument()
    expect(screen.getByText(/Richard Tran/)).toBeInTheDocument()
  })

  it('da dang nhap ma vao /login thi bi day ve man vi', async () => {
    saveSession({ token: 'token-abc', expiresInSeconds: 7200, walletId: 4, fullName: 'Richard Tran' })
    routeFetch({ '/api/wallets/4/transactions': NO_TRANSACTIONS, '/api/wallets/4': WALLET_OK })

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
    routeFetch({
      '/api/auth/login': AUTH_OK,
      '/api/wallets/4/transactions': NO_TRANSACTIONS,
      '/api/wallets/4': WALLET_OK,
    })
    renderApp('/login')

    fillLogin('anh@vieted.com', 'matkhau12345')

    expect(await screen.findByText('250.000,50 đ')).toBeInTheDocument()
  })

  it('token duoc luu lai de tai trang khong phai dang nhap lai', async () => {
    routeFetch({
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
    routeFetch({
      '/api/auth/login': json(401, {
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
    routeFetch({})
    renderApp('/login')

    fillLogin('anh@vieted.com', 'matkhau12345')

    expect(await screen.findByText('Không kết nối được tới máy chủ')).toBeInTheDocument()
  })
})

describe('dang xuat', () => {
  it('bam dang xuat thi ve man dang nhap va xoa token', async () => {
    saveSession({ token: 'token-abc', expiresInSeconds: 7200, walletId: 4, fullName: 'Richard Tran' })
    routeFetch({ '/api/wallets/4/transactions': NO_TRANSACTIONS, '/api/wallets/4': WALLET_OK })

    renderApp('/')
    await screen.findByText('250.000,50 đ')

    fireEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
    })
    expect(localStorage.getItem('ewallet.session')).toBeNull()
  })
})
