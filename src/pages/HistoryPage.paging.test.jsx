import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { AuthProvider } from '../auth/AuthProvider'
import { saveSession } from '../lib/session'
import { mockAdapter, ok, reply, restoreAdapter } from '../test/axiosMock'

/**
 * ⭐ Nut "Xem thêm": danh sách phải NỐI DÀI, không phải NHẢY TRANG.
 *
 * <p>Backend đổi hợp đồng 29/08 (ewallet-api #14) từ mảng sang
 * { items, nextCursor, hasMore }. Phần dễ là đổi `data` thành `data.items`.
 * Phần dễ sai là ba tuỳ chọn `serializeQueryArgs` / `merge` / `forceRefetch`
 * trong walletApi — thiếu cái nào cũng cho ra một màn hình SAI mà không lỗi:
 *
 * <ul>
 *   <li>thiếu `serializeQueryArgs`: mỗi trang một ô cache → màn hình NHẢY sang
 *       trang 2, 20 dòng đầu biến mất</li>
 *   <li>thiếu `merge`: trang 2 GHI ĐÈ trang 1</li>
 *   <li>thiếu `forceRefetch`: bấm "Xem thêm" KHÔNG gọi gì cả, vì cursor đã bị
 *       loại khỏi khoá cache nên RTK Query thấy hai lần gọi y hệt nhau</li>
 * </ul>
 *
 * <p>Cả ba đều compile sạch. Đây là lý do file này tồn tại.
 */

function renderApp() {
  return render(
    // ⚠️ Vao thang /lich-su, khong phai /. Sau khi tach bon tab thi trang chu
    // chi lay 5 giao dich va KHONG co nut "Xem them" - phan trang song o day.
    <MemoryRouter initialEntries={['/lich-su']}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
}

const WALLET_OK = reply(200, { id: 4, userId: 1, balance: '250000.50', version: 0 })

function giaoDich(id) {
  return {
    id,
    direction: 'IN',
    amount: `${id}00.00`,
    type: 'TRANSFER',
    status: 'SUCCESS',
    counterpartyWalletId: 2,
    createdAt: '2026-08-29T10:00:00.000000Z',
  }
}

const TRANG_1 = { items: [giaoDich(9), giaoDich(8)], nextCursor: 'moc-sau-dong-8', hasMore: true }
const TRANG_2 = { items: [giaoDich(7), giaoDich(6)], nextCursor: null, hasMore: false }

/** Server giả: trả trang nào là tuỳ `cursor` gửi lên — giống backend thật. */
function serverPhanTrang() {
  return mockAdapter((config) => {
    const url = `${config.baseURL ?? ''}${config.url ?? ''}`

    if (url.includes('/transactions')) {
      const trang = config.params?.cursor ? TRANG_2 : TRANG_1
      return ok(trang)(config)
    }
    return WALLET_OK(config)
  })
}

beforeEach(() => {
  localStorage.clear()
  saveSession({
    token: 'token-abc',
    refreshToken: 'rt-token-abc',
    expiresInSeconds: 7200,
    walletId: 4,
    fullName: 'Richard Tran',
  })
})
afterEach(restoreAdapter)

describe('phân trang lịch sử giao dịch', () => {
  it('bấm "Xem thêm" thì NỐI trang 2 vào dưới, trang 1 vẫn còn nguyên', async () => {
    serverPhanTrang()
    renderApp()

    expect(await screen.findByText(/900,00 đ/)).toBeInTheDocument()
    expect(screen.getByText(/800,00 đ/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Xem thêm' }))

    // Trang 2 đã về...
    expect(await screen.findByText(/700,00 đ/)).toBeInTheDocument()
    expect(screen.getByText(/600,00 đ/)).toBeInTheDocument()

    // ...và trang 1 KHÔNG biến mất. Đây là chỗ thiếu `merge` sẽ đỏ.
    expect(screen.getByText(/900,00 đ/)).toBeInTheDocument()
    expect(screen.getByText(/800,00 đ/)).toBeInTheDocument()
  })

  it('gửi đúng cursor server đưa, không tự chế', async () => {
    const adapter = serverPhanTrang()
    renderApp()

    await screen.findByText(/900,00 đ/)
    fireEvent.click(screen.getByRole('button', { name: 'Xem thêm' }))
    await screen.findByText(/700,00 đ/)

    const goiPhanTrang = adapter.mock.calls
      .map(([config]) => config)
      .filter((config) => `${config.url}`.includes('/transactions'))

    // Lần đầu: KHÔNG được gửi cursor. Gửi chuỗi rỗng là backend trả 400.
    expect(goiPhanTrang[0].params).toEqual({ limit: 20 })
    // Lần hai: đúng cái chuỗi server đưa, nguyên xi.
    expect(goiPhanTrang[1].params).toEqual({ limit: 20, cursor: 'moc-sau-dong-8' })
  })

  it('hết dữ liệu thì nút "Xem thêm" biến mất', async () => {
    serverPhanTrang()
    renderApp()

    await screen.findByText(/900,00 đ/)
    fireEvent.click(screen.getByRole('button', { name: 'Xem thêm' }))
    await screen.findByText(/700,00 đ/)

    // TRANG_2 có hasMore: false.
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Xem thêm' })).not.toBeInTheDocument(),
    )
  })
})
