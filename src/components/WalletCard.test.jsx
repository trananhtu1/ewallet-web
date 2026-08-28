import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import WalletCard from './WalletCard'

/**
 * 💰 Test o day bao ve dung MOT cau: khong biet so du thi phai noi la khong
 * biet, khong duoc noi la khong dong nao.
 *
 * Lo'i that da do tren trinh duyet: tat backend, tai lai trang, so du hien
 * "0,00 d" trong khi vi that co 37.654,33 d. Khong crash, khong log, chi la
 * con so dau tien nguoi dung nhin thay va no sai.
 */
describe('WalletCard', () => {
  it('hien so du that khi co du lieu', () => {
    render(<WalletCard wallet={{ id: 3, balance: '37654.33' }} loading={false} />)

    expect(screen.getByText('37.654,33 đ')).toBeInTheDocument()
    expect(screen.getByText('Ví #3')).toBeInTheDocument()
  })

  it('hien 0,00 d khi vi THAT SU rong', () => {
    // Phan biet voi test duoi: "0.00" la mot cau tra loi, undefined thi khong.
    render(<WalletCard wallet={{ id: 3, balance: '0.00' }} loading={false} />)

    expect(screen.getByText('0,00 đ')).toBeInTheDocument()
  })

  it('KHONG hien 0,00 d khi chua biet so du', () => {
    render(<WalletCard wallet={null} loading={false} />)

    expect(screen.queryByText('0,00 đ')).not.toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('KHONG hien 0,00 d khi vi ve nhung thieu truong balance', () => {
    // Hinh dang that luc goi API that bai giua chung.
    render(<WalletCard wallet={{ id: 3 }} loading={false} />)

    expect(screen.queryByText('0,00 đ')).not.toBeInTheDocument()
  })

  it('dang tai thi khong khang dinh gi ca', () => {
    render(<WalletCard wallet={null} loading />)

    expect(screen.queryByText('0,00 đ')).not.toBeInTheDocument()
    expect(screen.queryByText('—')).not.toBeInTheDocument()
  })
})
