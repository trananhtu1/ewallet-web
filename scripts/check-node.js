// Chan som, va bao bang tieng nguoi.
//
// Vi sao can file nay: node 20.11 chay `npm run dev` se chet giua chung bang
//   SyntaxError: The requested module 'node:util' does not provide an export named 'styleText'
// Doc dong do khong ai doan ra la "node cu qua" - no tro vao mot file trong
// node_modules/rolldown va nhin nhu mot bug cua thu vien.
//
// `engines` trong package.json chi chan luc `npm install`, khong chan `npm run`.
// Nen day la cho duy nhat bat duoc dung luc nguoi ta go lenh chay.
const [major, minor] = process.versions.node.split('.').map(Number)

// vite@8 khai bao: ^20.19.0 || >=22.12.0
const ok = (major === 20 && minor >= 19) || (major === 22 && minor >= 12) || major >= 23

if (!ok) {
  console.error(`
  Node ${process.versions.node} qua cu cho toolchain nay (vite 8 can >= 20.19).

  Sua:  nvm use          <- doc .nvmrc trong repo, khong phai nho so
  Chua co:  nvm install 24
`)
  process.exit(1)
}
