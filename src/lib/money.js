// Tien LUON la CHUOI tren duong truyen. Day khong phai so thich - da do that:
//
//   JSON.parse('{"balance":12345678901234567.89}').balance
//     -> 12345678901234568        MAT ca xu lan hang don vi
//   JSON.parse('{"balance":250000.50}').balance
//     -> 250000.5                 mat so 0 cuoi, hien ra "250.000,5 d"
//
// JavaScript chi co MOT kieu so va no la double. Nen backend co y tra chuoi
// (@JsonFormat(shape = STRING)), va file nay khong duoc phep goi Number() o
// bat cu buoc nao. Can cong tru thi dung decimal.js / big.js.

/** "250000.50" -> "250.000,50 đ". Lam viec hoan toan tren chuoi. */
export function formatMoney(value) {
  const text = String(value ?? '0')
  const negative = text.startsWith('-')
  const [whole = '0', cents = '00'] = (negative ? text.slice(1) : text).split('.')

  // Chen dau cham moi 3 chu so, tinh tu phai sang.
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  return `${negative ? '-' : ''}${grouped},${cents.padEnd(2, '0').slice(0, 2)} đ`
}

/** Dau + hay - dat truoc so tien trong danh sach lich su. */
export function signOf(direction) {
  return direction === 'IN' ? '+' : '−'
}

/**
 * Kiem so tien NGUOI DUNG go, truoc khi goi API.
 *
 * <p>Kiem o day KHONG thay the validate phia backend - no chi de bao loi ngay
 * ma khong ton mot vong goi mang. Backend van kiem lai, va backend moi la thu
 * quyet dinh: ai cung mo DevTools goi thang API duoc.
 *
 * Luat phai KHOP voi @DecimalMin("0.01") + @Digits(integer=17, fraction=2).
 */
export function validateAmount(input) {
  const text = String(input ?? '').trim()

  if (text === '') return 'Chưa nhập số tiền'
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return 'Số tiền chỉ được có tối đa 2 chữ số thập phân'

  // Truoc day dong nay la `Number(text) < 0.01` - chinh cai Number() ma dau file
  // nay cam. No khong lam sai KET QUA (so sanh do lon voi 0.01 thi double du
  // chinh xac), nhung no la mot qua min: ai do doi luat sau nay se coi Number()
  // o day la duoc phep va mang no sang cho tinh tien that.
  //
  // Regex tren da bao dam toi da 2 chu so thap phan, nen so duong nho nhat viet
  // ra duoc chinh la 0.01. Suy ra: nho hon 0.01 <=> moi chu so deu la 0.
  // Kiem bang chuoi, khong dong toi so thuc.
  if (/^0+(\.0{1,2})?$/.test(text)) return 'Số tiền tối thiểu là 0.01'
  if (text.split('.')[0].length > 17) return 'Số tiền quá lớn'

  return null
}
