# ewallet-web

**Giao diện web cho một hệ thống ví điện tử** — đăng ký, đăng nhập, xem số dư, nạp tiền,
chuyển tiền, và tra lịch sử giao dịch.

🌐 **Demo:** [ewallet-web.vercel.app](https://ewallet-web.vercel.app) ·
⚙️ **Backend:** [`ewallet-api`](https://github.com/trananhtu1/ewallet-api)

> ⏳ Backend chạy trên gói free của Render nên **ngủ sau 15 phút** không có traffic.
> Lần tải đầu mất **~75 giây** để đánh thức. Sau đó bình thường.

---

## Về dự án

Đây là nửa frontend của một hệ thống ví điện tử tự xây. Phần đáng nói không nằm ở giao diện
mà ở **những thứ frontend phải làm đúng khi đằng sau là tiền**:

| Vấn đề | Cách xử lý |
|---|---|
| JavaScript chỉ có một kiểu số, và nó là `double` | **Tiền đi qua dưới dạng chuỗi, cả hai chiều** — không gọi `Number()` ở bất kỳ bước nào |
| Token hết hạn giữa lúc người dùng đang thao tác | Tự làm mới token ngầm, **một lần cho nhiều request đang bay** *(single-flight)* |
| Gõ sai mật khẩu cũng trả 401, như phiên hết hạn | Phân biệt hai loại 401 — nhầm thì màn đăng nhập **tự đá chính nó** |
| Bấm "Chuyển tiền" hai lần vì mạng lag | Gửi kèm `Idempotency-Key`, backend chỉ ghi một lần |
| Lịch sử giao dịch dài | Phân trang **cursor**, nút "Xem thêm" nối trang |

**92 test** *(Vitest + React Testing Library)* canh những luật này — đặc biệt là luật về tiền:
có một ca dựng riêng cho `12345678901234567.89`, sẽ **đỏ ngay** nếu ai đó nhét `Number()` vào
giữa đường vì "cho gọn".

---

## Stack

| | |
|---|---|
| **Nền** | React 19 · Vite 8 · JavaScript |
| **Trạng thái** | Redux Toolkit · RTK Query · Redux-Saga |
| **Gọi API** | axios *(một instance, một chỗ gắn token)* |
| **Giao diện** | Tailwind CSS 4 · shadcn/ui · lucide-react |
| **Kiểm thử** | Vitest · React Testing Library |
| **Triển khai** | Vercel |

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
| `npm test` | chạy test một lượt rồi thoát |
| `npm run test:watch` | chạy test, tự chạy lại khi sửa file |

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

**Phạm vi quét (`@source`) được chỉ định tay, đừng bỏ đi.** Mặc định Tailwind quét cả
thư mục gốc repo **kể cả `README.md`** — nên mọi ví dụ `bg-primary` viết trong tài liệu
đều biến thành CSS thật gửi tới người dùng. Đã đo: bỏ `source(none)` ra thì bundle CSS
phình từ 7.06 kB lên 9.12 kB, toàn class không component nào dùng.

Hệ quả cần nhớ: **thêm thư mục source mới ngoài `src/` thì phải thêm một dòng `@source`**,
không thì class trong đó im lặng không sinh ra CSS.

Đặt tên class tự viết thì tránh tên Tailwind đã sở hữu — `.grid` là một ví dụ, nên class
bố cục hai cột ở đây tên là `.form-grid`.

## Test

```bash
npm test
```

Vitest dùng chung `vite.config.js` với app, **không có `vitest.config.js` riêng** — để test
chạy qua đúng đường ống mà app chạy, tránh cảnh "test xanh nhưng build đỏ".

Trọng tâm test nằm ở `src/lib/money.test.js`. Nó không kiểm "hàm chạy đúng" mà kiểm **lý do
hàm đó tồn tại**: có một ca dựng riêng cho `12345678901234567.89`, sẽ đỏ ngay nếu ai đó
nhét `Number()` vào giữa đường vì "cho gọn". Các test còn lại giữ cho luật validate ở FE
khớp với `@DecimalMin` / `@Digits` bên backend.

## Đăng nhập & cấu trúc

```
src/
  auth/         AuthProvider · useAuth · RequireAuth   (phiên đăng nhập)
  pages/        LoginPage · RegisterPage · WalletPage  (một file một màn)
  components/   các khối dùng lại
    ui/         shadcn/ui
  store/        Redux — authSlice · authSaga · walletApi (RTK Query)
  lib/          http (axios) · session · money · authRules  (không biết gì về React)
```

| Route | Ai vào được |
|---|---|
| `/login`, `/register` | mọi người; đã đăng nhập rồi thì bị đẩy về `/` |
| `/` | phải đăng nhập, `RequireAuth` chặn |
| còn lại | đẩy về `/`, rồi `RequireAuth` quyết định tiếp |

`RequireAuth` **không phải lớp bảo mật** — ai cũng sửa được JavaScript trong trình duyệt.
Thứ chặn thật là backend: token sai thì 401, không quan tâm màn hình nào hiện ra. Nó chỉ để
người dùng không nhìn thấy một trang trống rỗng.

**Token lưu ở `localStorage`.** Đánh đổi có thật, cần nói được: script chèn qua XSS đọc được
token; đổi lại nó không tự gửi kèm mỗi request nên không dính CSRF. Backend đang stateless và
nhận token qua header `Authorization`, không dùng cookie — nên đây là lựa chọn khớp với thiết
kế đó. Muốn `HttpOnly` cookie thì phải sửa cả backend lẫn CORS.

`Authorization: Bearer …` được gắn ở **đúng một chỗ** trong `api()`. Đổi cách xác thực thì sửa
ở đó, không phải đi tìm từng chỗ gọi API.

> ⚠️ **Hai loại 401, ý nghĩa ngược nhau.** Đang *có* token mà bị 401 = phiên hết hạn giữa
> chừng → đăng xuất. *Chưa* có token mà bị 401 = đang gõ sai mật khẩu → tuyệt đối không đăng
> xuất, nếu không màn đăng nhập sẽ tự đá chính nó mỗi lần gõ sai. `api.js` phân biệt bằng việc
> lúc gửi request có token hay không.

`session.js` là **một chỗ duy nhất** biết phiên hiện tại. Nó lưu **mốc hết hạn** chứ không lưu
số giây còn lại (số giây còn lại tính từ lúc nào? tải lại trang là không ai biết nữa), và trừ
hao 10 giây trước mốc thật — token còn 2 giây thì gửi đi gần như chắc chắn ăn 401 giữa chừng.

## Luật số một: tiền là chuỗi — **cả hai chiều**

Backend cố ý trả số tiền dạng `String` (`"250000.50"`), vì JavaScript chỉ có một kiểu số
và nó là `double`: `Number('12345678901234567.89')` ra `12345678901234568` — mất cả xu lẫn
hàng đơn vị. `src/lib/money.js` vì thế **không gọi `Number()` ở bất cứ bước nào**.

Điều dễ quên: luật này áp dụng cho **chiều gửi lên** nữa. `api.js` từng gửi
`amount: Number(amount)` — đọc thì hợp lý vì backend nhận `BigDecimal`, nhưng nó làm hỏng
số tiền *ngay trước khi rời trình duyệt*, trước cả khi backend kịp nhìn thấy. Giờ gửi chuỗi.

> Đã đo trên chính backend (`target/classes` + đúng bản Jackson của nó): gửi chuỗi
> `"12345678901234567.89"` thì `BigDecimal` nhận được đúng từng chữ số. Jackson ép
> `String` → `BigDecimal` sẵn, **không phải sửa gì bên backend**.

ID ví thì vẫn gửi số — chúng là `long` và là số nguyên nhỏ, không có gì để mất.

Cần cộng trừ tiền thì dùng `big.js`, đừng tự tính bằng số thực. Hiện chưa chỗ nào cần.

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
