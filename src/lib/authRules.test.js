import { describe, expect, it } from 'vitest'
import { validateEmail, validateFullName, validatePassword } from './authRules'

/**
 * Cac luat nay phai KHOP voi RegisterRequest ben backend. Test la cho chot chan:
 * doi rang buoc o backend ma quen doi o day thi FE se chan nham hoac tha nham,
 * va nguoi dung an mot vong goi mang moi biet.
 */
describe('validateEmail', () => {
  it('nhan email binh thuong', () => {
    expect(validateEmail('anh@vieted.com')).toBeNull()
  })

  it('bat o trong', () => {
    expect(validateEmail('')).toBe('Email không được để trống')
    expect(validateEmail('   ')).toBe('Email không được để trống')
  })

  it('chan chuoi khong phai email', () => {
    expect(validateEmail('khong-co-at')).not.toBeNull()
    expect(validateEmail('thieu@ten-mien')).not.toBeNull()
    expect(validateEmail('co khoang trang@vieted.com')).not.toBeNull()
  })

  it('KHONG doi hoa thuong', () => {
    // Backend da lo chuyen hoa thuong: Anh@Vieted.com va anh@vieted.com la MOT
    // nguoi. FE tu .toLowerCase() la hai ben xu ly khac nhau tren cung du lieu.
    expect(validateEmail('Anh@Vieted.com')).toBeNull()
  })

  it('chan email qua 255 ky tu', () => {
    expect(validateEmail(`${'a'.repeat(250)}@vieted.com`)).toBe('Email quá dài')
  })
})

describe('validatePassword', () => {
  it('nhan mat khau du dai', () => {
    expect(validatePassword('matkhau12345')).toBeNull()
    expect(validatePassword('a'.repeat(8))).toBeNull()
    expect(validatePassword('a'.repeat(72))).toBeNull()
  })

  it('chan ngan hon 8', () => {
    expect(validatePassword('a'.repeat(7))).toBe('Mật khẩu phải từ 8 đến 72 ký tự')
  })

  /** 72 khong phai con so bia: BCrypt chi doc 72 byte dau va lang le bo phan con lai. */
  it('chan dai hon 72', () => {
    expect(validatePassword('a'.repeat(73))).toBe('Mật khẩu phải từ 8 đến 72 ký tự')
  })

  it('KHONG cat khoang trang trong mat khau', () => {
    // "  a  b  " la mot mat khau hop le va dai 8 ky tu. Trim di la doi mat khau
    // cua nguoi ta, roi lan sau ho dang nhap khong duoc.
    expect(validatePassword('  a  b  ')).toBeNull()
  })
})

describe('validateFullName', () => {
  it('nhan ten binh thuong', () => {
    expect(validateFullName('Trần Anh Tú')).toBeNull()
  })

  it('bat o trong va chuoi toan dau cach', () => {
    expect(validateFullName('')).toBe('Họ tên không được để trống')
    expect(validateFullName('    ')).toBe('Họ tên không được để trống')
  })

  it('chan ten qua 100 ky tu', () => {
    expect(validateFullName('a'.repeat(101))).toBe('Họ tên quá dài')
  })
})
