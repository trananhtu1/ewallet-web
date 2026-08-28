import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Tailwind v4 chay nhu mot plugin cua Vite, khong con qua PostCSS nua.
  // Nghia la khong co tailwind.config.js va khong co postcss.config.js -
  // toan bo cau hinh nam trong src/index.css bang @theme.
  plugins: [react(), tailwindcss()],

  resolve: {
    // '@' tro vao src/. shadcn/ui SINH RA code dung duong dan nay - khong khai
    // bao thi moi component no them vao deu vo luc import.
    //
    // Khai bao o CA HAI cho: day cho Vite/Vitest thuc su phan giai duoc, va
    // jsconfig.json cho editor va CLI cua shadcn doc. Lech nhau thi editor bao
    // do trong khi build van chay, hoac nguoc lai.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    port: 5173,

    // strictPort = cổng 5173 bận thì DỪNG HẲN, không tự nhảy sang 5174.
    //
    // Mặc định của Vite là tự nhảy cổng và chỉ in một dòng nhỏ. Nghe thì tiện,
    // nhưng backend chỉ cho phép origin http://localhost:5173 gọi vào, nên nhảy
    // cổng là đổi origin -> request bị chặn và lỗi hiện ra dưới cái tên "CORS".
    // Mất thời gian đi tìm ở tầng CORS trong khi nguyên nhân nằm ở cổng.
    //
    // Cùng lý do với việc spring.datasource.* cố ý không có giá trị mặc định:
    // thà vỡ ngay lúc khởi động với thông báo đúng chỗ, còn hơn chạy tiếp rồi
    // vỡ ở một tầng khác với cái tên đánh lạc hướng.
    strictPort: true,
  },

  // Vitest dung chung file cau hinh nay voi Vite - khong co vitest.config.js
  // rieng. Nghia la test chay qua DUNG duong ong ma app chay: cung plugin
  // react, cung alias, cung cach xu ly import. Tach hai file la mo duong cho
  // canh "test xanh nhung build do".
  test: {
    // jsdom = mot DOM gia chay trong Node, de render component ma khong can
    // mo trinh duyet. Hai file test cua money.js khong can toi no, nhung
    // TransactionList thi can.
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',

    // BASE_URL trong api.js doc tu import.meta.env luc nap module. Khong dat o
    // day thi no la undefined va URL trong test thanh "undefined/api/...".
    env: { VITE_API_URL: 'http://test.local' },
  },
})
