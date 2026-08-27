import { describe, expect, it } from 'vitest'
import { formatMoney, signOf, validateAmount } from './money'

describe('formatMoney', () => {
  it('doi chuoi backend tra ve thanh dinh dang tien Viet', () => {
    expect(formatMoney('250000.50')).toBe('250.000,50 đ')
  })

  /**
   * Day la ca quan trong nhat trong ca file.
   *
   * No khong kiem "ham chay dung" - no kiem CAI LY DO ham nay ton tai. Neu mot
   * ngay nao do ai do sua formatMoney cho co Number() vao giua duong (vi "cho
   * gon"), moi test khac van xanh, chi mot test nay do. Va no do voi con so
   * chenh lech nhin thay duoc ngay.
   */
  it('giu nguyen so lon ma Number() se lam hong', () => {
    const raw = '12345678901234567.89'

    expect(formatMoney(raw)).toBe('12.345.678.901.234.567,89 đ')

    // Chung minh moi nguy: JavaScript chi co MOT kieu so va no la double.
    expect(String(Number(raw))).toBe('12345678901234568')
    // Ca phan thap phan bien mat - khong con dau cham nao trong ket qua.
    expect(String(Number(raw))).not.toContain('.')
  })

  it('bu du hai chu so thap phan', () => {
    // "5000.5" la NAM NGHIN NAM TRAM XU, khong phai 5 xu.
    expect(formatMoney('5000.5')).toBe('5.000,50 đ')
    expect(formatMoney('100')).toBe('100,00 đ')
  })

  it('giu dau am o ngoai cung', () => {
    expect(formatMoney('-5000.50')).toBe('-5.000,50 đ')
  })

  it('coi gia tri thieu la 0 thay vi vo ra chu NaN', () => {
    // Vi chua tai xong thi wallet.balance la undefined - man hinh phai ra
    // "0,00 đ" chu khong phai "NaN đ".
    expect(formatMoney(undefined)).toBe('0,00 đ')
    expect(formatMoney(null)).toBe('0,00 đ')
  })
})

describe('signOf', () => {
  it('dung dau tru THAT (U+2212), khong phai dau gach noi', () => {
    expect(signOf('IN')).toBe('+')
    // Ky tu nay la '−' (MINUS SIGN), rong bang dau '+' nen cot tien khong lech.
    expect(signOf('OUT')).toBe('−')
  })
})

/**
 * Cac luat duoi day phai KHOP voi @DecimalMin("0.01") va
 * @Digits(integer = 17, fraction = 2) ben backend.
 *
 * Test nay la cho chot chan: doi luat o backend ma quen doi o day thi FE se
 * chan nham hoac tha nham, va nguoi dung an mot vong goi mang moi biet.
 */
describe('validateAmount', () => {
  it('nhan so tien hop le', () => {
    expect(validateAmount('50000.00')).toBeNull()
    expect(validateAmount('0.01')).toBeNull()
  })

  it('bat o trong', () => {
    expect(validateAmount('')).toBe('Chưa nhập số tiền')
    expect(validateAmount('   ')).toBe('Chưa nhập số tiền')
  })

  it('chan qua hai chu so thap phan', () => {
    // 0.001 chinh la vi du that trong hop dong API: backend tra ve HAI loi
    // cung luc cho rieng field nay.
    expect(validateAmount('0.001')).toBe('Số tiền chỉ được có tối đa 2 chữ số thập phân')
  })

  it('chan chu va so am truoc khi ton mot vong goi mang', () => {
    expect(validateAmount('abc')).not.toBeNull()
    expect(validateAmount('-5')).not.toBeNull()
  })

  it('chan so tien duoi muc toi thieu', () => {
    expect(validateAmount('0')).toBe('Số tiền tối thiểu là 0.01')
    expect(validateAmount('0.00')).toBe('Số tiền tối thiểu là 0.01')
  })

  it('chan qua 17 chu so phan nguyen', () => {
    expect(validateAmount('12345678901234567')).toBeNull()   // 17 chu so - vua du
    expect(validateAmount('123456789012345678')).toBe('Số tiền quá lớn')
  })
})
