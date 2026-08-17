import { useEffect, useState } from 'react'

// Vite chỉ đưa ra trình duyệt những biến bắt đầu bằng VITE_.
// Đặt tên DB_PASSWORD ở đây thì nó không lọt ra — nhưng VITE_DB_PASSWORD thì lọt.
// Nhớ luật đó: mọi thứ có tiền tố VITE_ đều là công khai, ai mở DevTools cũng đọc được.
const API_URL = import.meta.env.VITE_API_URL

// Ba trạng thái, không phải hai. Người mới hay quên 'loading' rồi render
// nhầm "lỗi" trong lúc request còn đang bay.
//   { status: 'loading' }
//   { status: 'ok',    data: {...} }
//   { status: 'error', message: '...' }
const LOADING = { status: 'loading' }

export default function App() {
  const [health, setHealth] = useState(LOADING)

  useEffect(() => {
    // AbortController để huỷ request khi component unmount.
    // Thiếu nó, React StrictMode gọi effect 2 lần ở dev -> 2 request, và
    // request cũ về muộn có thể ghi đè kết quả mới (race condition).
    const controller = new AbortController()

    fetch(`${API_URL}/health`, { signal: controller.signal })
      .then((response) => {
        // fetch KHÔNG tự ném lỗi khi server trả 4xx/5xx.
        // Chỉ ném khi mạng chết. Phải tự kiểm tra response.ok.
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      })
      .then((data) => setHealth({ status: 'ok', data }))
      .catch((error) => {
        if (error.name === 'AbortError') return
        setHealth({ status: 'error', message: error.message })
      })

    return () => controller.abort()
  }, [])

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

        {health.status === 'loading' && <p>Đang gọi {API_URL}/health ...</p>}

        {health.status === 'error' && (
          <div>
            <p style={{ color: '#c00', fontWeight: 600 }}>Gọi thất bại: {health.message}</p>
            <p style={{ color: '#666', fontSize: 14 }}>
              Mở DevTools tab Console xem lỗi thật. Chữ "Failed to fetch" ở đây
              gần như không nói gì — nguyên nhân nằm trong Console.
            </p>
          </div>
        )}

        {health.status === 'ok' && (
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
        )}
      </section>
    </main>
  )
}
