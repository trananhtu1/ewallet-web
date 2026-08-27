import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Tailwind v4 chay nhu mot plugin cua Vite, khong con qua PostCSS nua.
  // Nghia la khong co tailwind.config.js va khong co postcss.config.js -
  // toan bo cau hinh nam trong src/index.css bang @theme.
  plugins: [react(), tailwindcss()],

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
})
