# ewallet-web

Frontend cho ứng dụng ví điện tử.

**Stack:** React 19 · Vite 8 · JavaScript

Backend nằm ở repo riêng: [`ewallet-api`](https://github.com/trananhtu1/ewallet-api)

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
