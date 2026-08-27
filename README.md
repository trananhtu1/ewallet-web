# ewallet-web

Frontend cho ứng dụng ví điện tử.

**Stack:** React 19 · Vite 8 · JavaScript · Tailwind CSS 4

Backend nằm ở repo riêng: [`ewallet-api`](https://github.com/trananhtu1/ewallet-api)

> 📋 **Đang làm gì tiếp theo:** [`VIEC-CAN-LAM.md`](VIEC-CAN-LAM.md)
> — việc theo thứ tự, 8 tình huống kiểm thử, và ba luật không được phá.
>
> 📄 Hợp đồng API đầy đủ (mọi JSON copy từ response thật, bảng 7 mã lỗi):
> `java-learn/FE-SONG-SONG.md`

---

## Yêu cầu

- **Node 20+** — `node -v`

## Cấu hình

Copy `.env.example` thành `.env.local` rồi trỏ vào backend:

```
VITE_API_URL=http://localhost:3003
```

> ⚠️ Vite chỉ đưa ra trình duyệt những biến có tiền tố `VITE_`. Nghĩa là
> **mọi biến `VITE_` đều là công khai** — ai mở DevTools cũng đọc được.
> Không bao giờ đặt mật khẩu hay khoá bí mật vào đây.

`.env.local` đã bị `.gitignore` chặn, không commit.

## Chạy

```bash
npm install     # lần đầu
npm run dev
```

→ <http://localhost:5173>

**Backend phải chạy trước**, nếu không trang sẽ báo `Failed to fetch`.

| Lệnh | Việc |
|---|---|
| `npm run dev` | chạy chế độ dev, có hot reload |
| `npm run build` | build ra `dist/` |
| `npm run preview` | xem thử bản build |
| `npm run lint` | kiểm tra code |

## Styling — Tailwind CSS 4

Tailwind v4 chạy như **một plugin của Vite**, không đi qua PostCSS nữa. Hệ quả:
**không có `tailwind.config.js`, không có `postcss.config.js`** — tìm hai file này
không thấy là đúng, đừng tạo lại. Toàn bộ cấu hình nằm trong `src/index.css`.

Bảng màu khai báo bằng `@theme` chứ không phải `:root`. Khác biệt đáng giá: `@theme`
vừa tạo biến CSS vừa **sinh ra utility tương ứng** — khai `--color-primary` thì có
luôn `bg-primary`, `text-primary`, `border-primary`. Khai ở `:root` chỉ được vế đầu.
Một bảng màu, dùng được cả CSS thường lẫn class trên JSX, không bao giờ lệch nhau.

Các class có sẵn (`.card`, `.button`, `.input`…) nằm trong `@layer components`, cố ý.
Hai class cùng độ ưu tiên thì cái đứng sau trong file thắng — để tràn ra ngoài layer
thì `.card` sẽ đè utility, và `<form class="card p-8">` **không ăn `p-8`**. Nằm trong
`components` thì utility luôn thắng, trộn hai lối viết mới hoạt động đúng kỳ vọng.

> ⚠️ Preflight (reset của Tailwind) trả `h1`–`h6` về `font-weight: inherit` — không
> còn đậm theo mặc định trình duyệt. Thêm heading mới thì phải tự ghi `font-weight`.

## Deploy (Vercel)

Vercel tự nhận ra đây là project Vite, không cần cấu hình build.

**Bắt buộc:** vào Project Settings → Environment Variables, thêm `VITE_API_URL`
trỏ vào domain Render của backend, **rồi mới deploy**.

> ⚠️ **Bẫy quan trọng nhất:** Vite **nướng** biến `VITE_*` vào file `.js` lúc
> **build**, không đọc lúc chạy. Kiểm chứng được: build với một URL rồi mở file
> trong `dist/assets/*.js` ra tìm, sẽ thấy chuỗi URL nằm nguyên trong đó.
>
> Hệ quả: đổi `VITE_API_URL` trên Vercel thì **phải Redeploy**, không phải restart.
> Chỉ đổi biến rồi thấy trang vẫn gọi URL cũ — đây là lý do.
>
> Khác hẳn backend: Spring đọc biến lúc **chạy**, đổi biến + restart là xong.

`vercel.json` có một quy tắc `rewrites` đưa mọi đường dẫn về `index.html`. Chưa
cần lúc này vì trang chỉ có một route, nhưng khi thêm React Router ở Week 3 thì
thiếu nó là vào `/login` rồi **F5 sẽ ra 404** — Vercel đi tìm file `/login` không
có thật, trong khi routing do React xử lý ở phía trình duyệt.

## Xử lý sự cố

**Trang báo `Failed to fetch`** — dòng chữ này gần như không nói gì. Nguyên nhân thật
nằm trong **DevTools → Console**. Hai khả năng hay gặp nhất:

1. **Backend chưa chạy** → mở `http://localhost:3003/health` xem có ra JSON không.
2. **Lỗi CORS** → Console sẽ ghi rõ `blocked by CORS policy`. Sửa ở **backend**,
   không phải ở đây: đặt biến `CORS_ALLOWED_ORIGINS` bao gồm `http://localhost:5173`.

Dấu hiệu nhận ra lỗi CORS trong tab Network: request **vẫn trả `200` và vẫn có
đủ dữ liệu**, nhưng code không đọc được. Server không chặn — trình duyệt chặn.

**Đổi cổng backend** → sửa `VITE_API_URL` trong `.env.local` rồi **khởi động lại**
`npm run dev`. Biến môi trường của Vite được nạp lúc khởi động, hot reload không cập nhật.
