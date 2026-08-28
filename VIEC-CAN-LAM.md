# Việc cần làm — frontend

> Brief cho phiên làm việc tiếp theo. Cập nhật **28/08/2026**.
> Hợp đồng API đầy đủ: `java-learn/FE-SONG-SONG.md`.

---

## ✅ 28/08 — ĐÃ MỞ TRÊN TRÌNH DUYỆT LẦN ĐẦU

Việc số 1 của bản brief cũ đã làm xong. Chạy hết luồng thật trên Chromium:
đăng ký → tự tạo ví → nạp → chuyển → lịch sử, cộng 6 ca lỗi và màn 375px.

**Ba lỗi bắt được, không cái nào lộ ra khi chỉ đọc code:**

| # | Lỗi | Vì sao chỉ mở trình duyệt mới thấy |
|---|---|---|
| 1 | 💰 Backend chết → hiện **`0,00 đ`** và *"Chưa có giao dịch nào"* | Phải **tắt** backend rồi tải lại mới gặp. Ví thật có `37.654,33 đ` |
| 2 | Nút "Nạp tiền" là nút **phụ**, "Chuyển tiền" là nút **chính** | Một chữ khác nhau trong `className`, đọc code không gợn; nhìn thì thấy ngay một cái trông như bị khoá |
| 3 | `<title>` vẫn là `ewallet-web-tmp` | Nó không nằm trong React, nên không ai mở `src/` mà thấy |

Lỗi 1 sửa ở PR *"Stop telling people they have no money…"*, lỗi 2–3 ở PR này.

> 📌 **Bài học giữ lại:** `npm run build` sạch, `npm run lint` sạch, 64 test xanh —
> mà vẫn có một màn hình nói dối về số dư. **Build được không có nghĩa là đúng.**

⚠️ **Node trên máy Mac là v20.11.0, KHÔNG chạy được Vite 8** (thiếu `styleText`
trong `node:util`, có từ Node 20.12). Dùng `nvm use 24` trước mọi lệnh npm.

---

## Đang có gì

```
src/lib/api.js         ApiError + NetworkError · getWallet/getTransactions/deposit/transfer · groupFieldErrors
src/lib/money.js       formatMoney · signOf · validateAmount
src/lib/session.js     currentWalletId · setCurrentWalletId
src/components/        WalletCard · DepositForm · TransferForm · TransactionList
src/App.jsx            ghép lại + xử lý "backend đang ngủ dậy"
src/index.css          bảng màu trong @theme + class của project
vite.config.js         plugin Tailwind v4
```

**Đã kiểm:** `npm run lint` sạch · `npm run build` sạch · Vite dev phục vụ được ·
CORS đo hai chiều (origin đúng được cho qua, origin lạ bị **403**).

> 🎨 **Tailwind v4 đã được thêm vào** (phiên song song, 27/08) — plugin của Vite, không có
> `tailwind.config.js` cũng không có `postcss.config.js`, cấu hình nằm thẳng trong
> `src/index.css` bằng `@theme`. Class cũ của project (`.page`, `.card`, `.button`, `.tx-list`…)
> **vẫn còn nguyên** và bảng màu dùng chung, nên viết kiểu nào cũng không lệch màu.
> Build sau khi thêm: CSS 9.12 kB (gzip 2.76 kB).

**⚠️ CHƯA AI MỞ TRÊN TRÌNH DUYỆT.** Code biên dịch được không có nghĩa là nhìn được.
Việc số 1 bên dưới là chuyện đó.

---

## Ba luật không được phá

**1. 💰 Tiền là chuỗi.** Backend trả `"balance": "250000.50"`. Đã đo: `JSON.parse` biến
`12345678901234567.89` thành `12345678901234568` — mất cả xu lẫn hàng đơn vị; `250000.50`
thành `250000.5`.

- ❌ Không `Number(balance)` / `parseFloat(balance)` rồi đem tính
- ✅ Hiển thị bằng `formatMoney()` — nó làm việc hoàn toàn trên chuỗi
- ✅ Cần cộng trừ ở client thì cài `decimal.js`, **đừng** dùng số thực

**2. Rẽ nhánh theo `err.code`, không bao giờ theo `err.message`.** `message` là tiếng Việt cho
người dùng và có thể đổi chữ bất cứ lúc nào. `code` là hợp đồng.

**3. Id ví chỉ được lấy từ `currentWalletId()`.** Đừng rải `walletId` vào component hay URL.
Backend chưa có JWT; khi có, `session.js` đổi ruột và **không file nào khác phải sửa**.

---

## Việc, theo thứ tự

### 1. Chạy lên và nhìn bằng mắt ⭐ làm trước

```bash
# 1. Backend phai chay truoc, va PHAI co du lieu
#    Vi #1 chua ton tai -> trang hien "Khong tim thay vi #1", khong phai man trang.
#    Cach tao du lieu: java-learn/java/04-database/BUOI-2.md muc "Tao du lieu de thu"

# 2. .env.local
echo "VITE_API_URL=http://localhost:3003" > .env.local

# 3. Chay
npm run dev        # cong 5173, strictPort - ban cong thi DUNG HAN, khong nhay 5174
```

> Cổng **phải** là 5173. Backend chỉ cho origin `http://localhost:5173` gọi vào, nhảy cổng là
> đổi origin và lỗi sẽ hiện ra dưới cái tên "CORS" — mất thời gian tìm nhầm tầng.

**Xong khi:** mở `http://localhost:5173`, thấy số dư, nạp được tiền, chuyển được tiền, lịch sử
cập nhật. Sửa mọi thứ vỡ hoặc xấu gặp trên đường.

---

### 2. Ô đổi ví — chưa có, và nó chặn việc test

`setCurrentWalletId()` đã viết trong `session.js` nhưng **chưa ai gọi**. Không đổi được ví thì
không kiểm được chuyển tiền hai chiều, cũng không thấy được `direction` lật `IN`/`OUT`.

Thêm vào `App.jsx`, chỗ header — nhỏ thôi, một ô số + nút:

```jsx
// Tam thoi, se bo khi co JWT. Doi ta gan localStorage roi reload cho don gian:
// khong dang bo cong lam state dong bo cho mot thu sap bien mat.
```

**Xong khi:** đổi sang ví `2`, thấy số dư khác, và giao dịch vừa nhận hiện `IN` ở ví này trong
khi ở ví `1` nó là `OUT` — **cùng một `id` giao dịch**.

---

### 3. Tiêu đề trang và favicon

`index.html` đang là `<title>ewallet-web-tmp</title>` và favicon mặc định của Vite.
Đây là thứ nhà tuyển dụng nhìn thấy đầu tiên trên tab trình duyệt.

**Xong khi:** title là "Ví điện tử", favicon không còn là logo Vite.

---

### 4. Kiểm thử thủ công — 8 tình huống

Chạy hết, tick từng cái. Mỗi dòng ứng với một mã lỗi backend thật sự trả về:

| # | Làm gì | Phải thấy |
|---|---|---|
| 1 | Nạp `50000` | Số dư tăng ngay, có dòng mới trong lịch sử |
| 2 | Nạp `0.001` | Lỗi **dưới ô input** — và có thể là **2 dòng lỗi cùng lúc** |
| 3 | Nạp để trống | Lỗi client, **không gọi API** (xem tab Network) |
| 4 | Chuyển quá số dư | Lỗi ở **mức form**, không phải dưới ô input |
| 5 | Chuyển cho chính ví mình | Lỗi dưới ô "ví đích" |
| 6 | Chuyển tới ví `999` | "Không tìm thấy ví này" dưới ô "ví đích" |
| 7 | Tắt backend rồi tải lại trang | Báo lỗi tử tế, **không phải màn trắng** |
| 8 | Đổi `currentWalletId` sang ví không tồn tại | "Không tìm thấy ví #N", không phải màn trắng |

> Tình huống 2 là cái đáng xem nhất: `fieldErrors` là **mảng**, một field trượt được nhiều
> luật cùng lúc. `groupFieldErrors` đã gom sẵn, chỉ cần render hết.

---

### 5. Màn hình hẹp

`.grid` gãy xuống một cột ở `620px`. Chưa ai kiểm thật.

**Xong khi:** ở **375px** không có thanh cuộn ngang, số dư không tràn, nút bấm không bị bóp.

---

### 6. Vài chi tiết nhỏ đáng làm

- [ ] `aria-live="polite"` cho vùng lỗi form — trình đọc màn hình đọc được lỗi mới
- [ ] `autoFocus` vào ô số tiền của form nạp
- [ ] Enter trong ô input phải submit được (đang dùng `<form>` nên chắc đã có — **kiểm lại**)
- [ ] Nạp/chuyển xong: giữ nguyên vị trí cuộn, đừng nhảy lên đầu trang

---

### 7. Deploy Vercel

**Xong khi:** URL Vercel thật gọi được backend Render thật, nạp và chuyển tiền chạy trên
production. Hai thứ phải chỉnh:

| Ở đâu | Đặt gì |
|---|---|
| Vercel → Environment Variables | `VITE_API_URL=https://<ten-service>.onrender.com` |
| Render → Environment | `CORS_ALLOWED_ORIGINS=https://<domain>.vercel.app` |

> ⚠️ `VITE_*` được nhúng **lúc build**, không phải lúc chạy. Đổi biến trên Vercel mà không
> build lại thì URL cũ vẫn nằm trong bundle. Phải **redeploy**.

---

## ❌ Đừng làm bây giờ

~~Đăng ký / đăng nhập~~ — **đã xong 27/08**, backend có API rồi ·
đổi mật khẩu · upload KYC · dark mode · nhiều loại tiền tệ · phân trang số trang (1,2,3…)

> ROADMAP §"Quy tắc scope": *"cái này có làm CV mạnh hơn không? Không → không làm."*

### 🔄 Một quyết định đã ĐỔI — ghi lại chứ không lặng lẽ bỏ

Dòng này trước đây nằm trong danh sách **đừng làm**:

> ~~thêm **thư viện component** (shadcn, MUI, Ant…) — Tailwind đã đủ, kéo thêm bộ component là
> kéo thêm thứ phải học và phải bảo trì.~~

**28/08 đã làm ngược lại** — thêm `shadcn` + `radix-ui` + `lucide-react` + `sonner`. Ghi lại
đây thay vì xoá dòng cũ, vì một quyết định bị đảo mà không ai giải thích thì lần sau lại đem
ra tranh luận từ đầu.

⚠️ **Nhưng lý do cũ vẫn đúng một phần, và số đo cho thấy điều đó:**

| | Trước | Sau |
|---|---|---|
| JS | 241.71 kB *(77.16 gzip)* | **417.07 kB** *(135.90 gzip)* |
| CSS | 7.70 kB *(2.48 gzip)* | **40.23 kB** *(8.16 gzip)* |

Và **7 trong 8** component sinh ra ở `src/components/ui/` **chưa file nào của app import**:
`button` · `card` · `input` · `label` · `skeleton` · `table` · `dropdown-menu`. Vite tree-shake
nên chúng **không vào bundle**, nhưng vẫn là code phải đọc và phải bảo trì.

**Việc cần làm:** hoặc dùng chúng thật (đổi các form sang `<Button>`, `<Input>`, `<Card>`),
hoặc **xoá đi**. Để nguyên là tệ nhất — nó làm người đọc tưởng app đã chuyển sang shadcn
trong khi các trang vẫn dùng class `.card` / `.input` / `.button` viết tay.

*(Thứ thật sự đang dùng: `sonner` cho toast, `lucide-react` cho icon trong hai form tiền.)*

---

## Cái gì SẼ đổi — đừng xây chặt vào

| Thứ | Sẽ thành | Chống đỡ ngay bây giờ |
|---|---|---|
| **Auth** | Có `/login`, mọi request kèm `Authorization: Bearer …` | Gắn header ở **một chỗ** trong `api()` |
| **Ví hiện tại** | `/api/wallets/{id}` có thể thành `/api/wallets/me` | Chỉ gọi `currentWalletId()` |
| **`status: "FAILED"`** | Backend còn nợ, hiện **chưa bao giờ trả về** | Nhánh hiển thị đã viết sẵn trong `TransactionList` — giữ nguyên |
| **Phân trang** | Giờ chỉ có `limit`, sau sẽ có cursor | Đừng làm phân trang số trang |

---

## Trước khi commit

```bash
npm run lint     # phai sach
npm run build    # phai sach
```

Quy ước repo: **định danh và tên file tiếng Anh, comment tiếng Việt.** JavaScript, **không**
TypeScript.
