// MOT cho duy nhat biet "vi hien tai la ai".
//
// Backend chua co JWT nen vi duoc goi bang id tran tren URL. Khi auth xong,
// duong dan co the thanh /api/wallets/me va id se doc tu token - luc do CHI
// file nay phai sua. Rai walletId khap component thi phai lung tung cho mot.

const STORAGE_KEY = 'ewallet.walletId'

export function currentWalletId() {
  const saved = Number(localStorage.getItem(STORAGE_KEY))
  return Number.isInteger(saved) && saved > 0 ? saved : 1
}

export function setCurrentWalletId(id) {
  localStorage.setItem(STORAGE_KEY, String(id))
}
