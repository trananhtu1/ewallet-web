// Cac luat duoi day PHAI khop voi RegisterRequest ben backend. Kiem o client
// chi de bao loi ngay ma khong ton mot vong goi mang - backend van kiem lai, va
// backend moi la thu quyet dinh.

/** Khop @NotBlank + @Email + @Size(max = 255). */
export function validateEmail(input) {
  const text = String(input ?? '').trim()

  if (text === '') return 'Email không được để trống'
  // Co y de long: viec bat email that hay khong la viec cua buoc gui thu xac
  // thuc, khong phai cua mot bieu thuc chinh quy. Cho nay chi chan loi go nham.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return 'Email không đúng định dạng'
  if (text.length > 255) return 'Email quá dài'

  return null
}

/**
 * Khop @Size(min = 8, max = 72).
 *
 * <p>Con so 72 khong phai bia: BCrypt chi doc 72 BYTE dau tien va lang le bo
 * phan con lai - mat khau 100 va 200 ky tu cung tien to se dang nhap duoc bang
 * nhau, khong loi nao bao.
 *
 * <p>Luu y: cho nay dem KY TU de khop dung @Size cua backend. Chung khong phai
 * mot: mot ky tu tieng Viet co dau chiem toi 3 byte trong UTF-8, nen mot mat
 * khau 72 ky tu tieng Viet da vuot 72 byte tu lau. Do la khe ho ben backend,
 * FE khong tu vá duoc - vá o day chi lam FE va BE bat dong y kien.
 */
export function validatePassword(input) {
  const text = String(input ?? '')

  if (text.trim() === '') return 'Mật khẩu không được để trống'
  if (text.length < 8) return 'Mật khẩu phải từ 8 đến 72 ký tự'
  if (text.length > 72) return 'Mật khẩu phải từ 8 đến 72 ký tự'

  return null
}

/** Khop @NotBlank + @Size(max = 100). */
export function validateFullName(input) {
  const text = String(input ?? '').trim()

  if (text === '') return 'Họ tên không được để trống'
  if (text.length > 100) return 'Họ tên quá dài'

  return null
}
