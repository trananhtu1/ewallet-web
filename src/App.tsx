import { useEffect, useState } from 'react'

// Vite chỉ đưa ra trình duyệt những biến bắt đầu bằng VITE_.
// Đặt tên DB_PASSWORD ở đây thì nó không lọt ra — nhưng VITE_DB_PASSWORD thì lọt.
// Nhớ luật đó: mọi thứ có tiền tố VITE_ đều là công khai, ai mở DevTools cũng đọc được.
const API = import.meta.env.VITE_API_URL

type Health = {
  status: string
  service: string
  profile: string
  java: string
  time: string
}

// Ba trạng thái, không phải hai. Người mới hay quên 'loading' rồi render
// nhầm "lỗi" trong lúc request còn đang bay.
type State =
  | { tag: 'loading' }
  | { tag: 'ok'; data: Health }
  | { tag: 'loi'; message: string }

export default function App() {
  const [state, setState] = useState<State>({ tag: 'loading' })

  useEffect(() => {
    // AbortController để huỷ request khi component unmount.
    // Thiếu nó, React StrictMode gọi effect 2 lần ở dev -> 2 request, và
    // request cũ về muộn có thể ghi đè kết quả mới (race condition).
    const ac = new AbortController()

    fetch(`${API}/health`, { signal: ac.signal })
      .then(async (res) => {
        // fetch KHÔNG tự ném lỗi khi server trả 4xx/5xx.
        // Chỉ ném khi mạng chết. Phải tự kiểm tra res.ok.
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return (await res.json()) as Health
      })
      .then((data) => setState({ tag: 'ok', data }))
      .catch((e: unknown) => {
        if (e instanceof Error && e.name === 'AbortError') return
        setState({ tag: 'loi', message: e instanceof Error ? e.message : String(e) })
      })

    return () => ac.abort()
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

        {state.tag === 'loading' && <p>Đang gọi {API}/health ...</p>}

        {state.tag === 'loi' && (
          <div>
            <p style={{ color: '#c00', fontWeight: 600 }}>Gọi thất bại: {state.message}</p>
            <p style={{ color: '#666', fontSize: 14 }}>
              Mở DevTools tab Console xem lỗi thật. Chữ "Failed to fetch" ở đây
              gần như không nói gì — nguyên nhân nằm trong Console.
            </p>
          </div>
        )}

        {state.tag === 'ok' && (
          <table style={{ borderCollapse: 'collapse', fontSize: 14 }}>
            <tbody>
              {Object.entries(state.data).map(([k, v]) => (
                <tr key={k}>
                  <td style={{ padding: '4px 16px 4px 0', color: '#666' }}>{k}</td>
                  <td style={{ padding: '4px 0', fontFamily: 'monospace' }}>{String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  )
}
