import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import TransactionList from './TransactionList'

// Copy tu response that cua GET /api/wallets/1/transactions - khong che tay.
const TRANSACTIONS = [
  {
    id: 3, direction: 'IN', amount: '900.00', type: 'TRANSFER',
    status: 'SUCCESS', counterpartyWalletId: 2, createdAt: '2026-08-27T15:38:42.033238Z',
  },
  {
    id: 1, direction: 'IN', amount: '7000.00', type: 'DEPOSIT',
    status: 'SUCCESS', counterpartyWalletId: null, createdAt: '2026-08-27T15:38:41.905206Z',
  },
]

describe('TransactionList', () => {
  it('hien trang thai dang tai', () => {
    render(<TransactionList transactions={[]} loading />)
    expect(screen.getByText(/Đang tải lịch sử/)).toBeInTheDocument()
  })

  it('hien loi moi thay vi mot danh sach rong khong giai thich gi', () => {
    render(<TransactionList transactions={[]} loading={false} />)
    expect(screen.getByText(/Chưa có giao dịch nào/)).toBeInTheDocument()
  })

  /**
   * Cung mot cai bay voi so du: khong tai duoc lich su KHONG PHAI la chua co
   * giao dich nao. Do that tren trinh duyet: tat backend, tai lai trang, mot vi
   * dang co 2 giao dich van hien "Chua co giao dich nao. Nap tien de bat dau."
   * - vua sai, vua xui nguoi dung bo them tien vao he thong dang hong.
   */
  it('khong noi "chua co giao dich" khi that ra la khong tai duoc', () => {
    render(<TransactionList transactions={[]} loading={false} unavailable />)

    expect(screen.queryByText(/Chưa có giao dịch nào/)).not.toBeInTheDocument()
    expect(screen.getByText(/Không tải được lịch sử/)).toBeInTheDocument()
  })

  it('goi ten giao dich theo type va direction', () => {
    render(<TransactionList transactions={TRANSACTIONS} loading={false} />)

    // DEPOSIT: tien tu ngoai vao, counterpartyWalletId la null nen KHONG duoc
    // hien "Nhan tu vi #null".
    expect(screen.getByText('Nạp tiền')).toBeInTheDocument()
    expect(screen.getByText('Nhận từ ví #2')).toBeInTheDocument()
    expect(screen.queryByText(/#null/)).not.toBeInTheDocument()
  })

  it('to mau IN xanh va dat dau + truoc so tien', () => {
    render(<TransactionList transactions={TRANSACTIONS} loading={false} />)

    const amount = screen.getByText(/900,00 đ/)
    expect(amount).toHaveTextContent('+')
    expect(amount).toHaveClass('tx__amount--in')
  })

  /**
   * `status: "FAILED"` backend CHUA BAO GIO tra ve - no con no REQUIRES_NEW.
   * Nhanh hien thi da viet san, va test nay giu cho no song: khong co test,
   * mot doan code chua ai nhin thay chay bao gio rat de bi xoa nham hoac hong
   * am tham, roi den ngay backend tra FAILED that thi moi vo.
   */
  it('hien nhan "That bai" cho giao dich FAILED', () => {
    const failed = [{ ...TRANSACTIONS[0], status: 'FAILED' }]
    render(<TransactionList transactions={failed} loading={false} />)

    expect(screen.getByText('Thất bại')).toBeInTheDocument()
  })
})
