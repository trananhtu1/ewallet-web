import { useEffect, useState } from 'react'

// Vite chỉ đưa ra trình duyệt những biến bắt đầu bằng VITE_.
// Đặt tên DB_PASSWORD ở đây thì nó không lọt ra — nhưng VITE_DB_PASSWORD thì lọt.
// Nhớ luật đó: mọi thứ có tiền tố VITE_ đều là công khai, ai mở DevTools cũng đọc được.
const API_URL = import.meta.env.VITE_API_URL

// Chờ quá bấy nhiêu giây thì gần như chắc chắn backend đang ngủ dậy chứ không
// phải mạng chậm: gọi lúc backend đã thức chỉ mất chưa tới 1 giây.
// Render free cho service ngủ sau 15 phút không có traffic, dậy lại mất ~1 phút.
const WAKE_HINT_AFTER_SECONDS = 4

export default function App() {
  // Ba trạng thái, không phải hai:
  //   { status: 'loading' }
  //   { status: 'ok',    data: {...}, tookMs }
  //   { status: 'error', message: '...', tookMs }
  // Quên 'loading' là render nhầm "lỗi" trong lúc request còn đang bay.
  const [health, setHealth] = useState({ status: 'loading' })

  // Mốc thời gian bắt đầu gọi. Dùng hàm khởi tạo (useState(() => ...)) để
  // Date.now() chỉ chạy một lần lúc mount, không chạy lại mỗi lần render.
  const [startedAt] = useState(() => Date.now())
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    // AbortController để huỷ request khi component unmount.
    // Thiếu nó, React StrictMode gọi effect 2 lần ở dev -> 2 request, và
    // request cũ về muộn có thể ghi đè kết quả mới (race condition).
    const controller = new AbortController()

    // CỐ Ý không đặt timeout huỷ request. Cold start của Render mất khoảng 1
    // phút, huỷ sau 10s là tự tay biến một lần chờ bình thường thành lỗi.
    fetch(`${API_URL}/health`, { signal: controller.signal })
      .then((response) => {
        // fetch KHÔNG tự ném lỗi khi server trả 4xx/5xx.
        // Chỉ ném khi mạng chết. Phải tự kiểm tra response.ok.
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      })
      .then((data) => setHealth({ status: 'ok', data, tookMs: Date.now() - startedAt }))
      .catch((error) => {
        if (error.name === 'AbortError') return
        setHealth({ status: 'error', message: error.message, tookMs: Date.now() - startedAt })
      })

    return () => controller.abort()
  }, [startedAt])

  // Đồng hồ chỉ chạy trong lúc còn đang chờ.
  useEffect(() => {
    if (health.status !== 'loading') return

    // Tính bằng HIỆU của Date.now(), không cộng dồn một biến đếm. Trình duyệt
    // hạ tần suất setInterval xuống còn ~1 lần/phút khi tab chạy nền, nên cộng
    // dồn sẽ ra số sai bét. Lấy hiệu hai mốc thời gian thì tab ẩn bao lâu cũng đúng.
    const timer = setInterval(() => {
      setElapsed(Math.round((Date.now() - startedAt) / 1000))
    }, 500)

    return () => clearInterval(timer)
  }, [health.status, startedAt])

  const isWaking = health.status === 'loading' && elapsed >= WAKE_HINT_AFTER_SECONDS
  const seconds = (ms) => (ms / 1000).toFixed(1)

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 32, maxWidth: 640 }}>
      <h1 style={{ marginBottom: 4 }}>Ví điện tử</h1>
      <p style={{ color: '#666', marginTop: 0 }}>
        Trang này chỉ làm một việc: chứng minh frontend gọi được backend.
      </p>

      <section
        style={{
          border: '1px solid #ddd',
          borderRadius: 8,
          padding: 20,
          marginTop: 24,
        }}
      >
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Backend</h2>

        {health.status === 'loading' && !isWaking && <p>Đang gọi {API_URL}/health ...</p>}

        {isWaking && (
          <div>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>
              Backend đang khởi động — đã chờ {elapsed}s
            </p>
            <p style={{ color: '#666', fontSize: 14, marginTop: 0 }}>
              Backend chạy trên gói miễn phí của Render, tự tắt sau 15 phút không
              ai dùng và mất khoảng 1 phút để dậy lại. Trang đang chờ, không phải lỗi.
            </p>
          </div>
        )}

        {health.status === 'error' && (
          <div>
            <p style={{ color: '#c00', fontWeight: 600 }}>Gọi thất bại: {health.message}</p>
            <p style={{ color: '#666', fontSize: 14 }}>
              Mở DevTools tab Console xem lỗi thật. Chữ "Failed to fetch" ở đây
              gần như không nói gì — nguyên nhân nằm trong Console.
            </p>
            {health.tookMs >= WAKE_HINT_AFTER_SECONDS * 1000 && (
              <p style={{ color: '#666', fontSize: 14 }}>
                Thất bại sau {seconds(health.tookMs)}s — lâu thế này thường là
                backend đang khởi động dở. Tải lại trang sau khoảng một phút.
              </p>
            )}
          </div>
        )}

        {health.status === 'ok' && (
          <>
            {health.tookMs >= WAKE_HINT_AFTER_SECONDS * 1000 && (
              <p style={{ color: '#666', fontSize: 14, marginTop: 0 }}>
                Backend vừa được đánh thức sau {seconds(health.tookMs)}s — lần
                gọi sau sẽ nhanh, tới khi nó lại ngủ vì 15 phút không ai dùng.
              </p>
            )}
            <table style={{ borderCollapse: 'collapse', fontSize: 14 }}>
              <tbody>
                {Object.entries(health.data).map(([key, value]) => (
                  <tr key={key}>
                    <td style={{ padding: '4px 16px 4px 0', color: '#666' }}>{key}</td>
                    <td style={{ padding: '4px 0', fontFamily: 'monospace' }}>
                      {typeof value === 'object' && value !== null
                        ? JSON.stringify(value)
                        : String(value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>
    </main>
  )
}
