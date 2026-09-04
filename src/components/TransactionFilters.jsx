import { X } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'

/**
 * Bo loc lich su giao dich.
 *
 * <p>⭐ Nam tham so nay backend da NHAN TU 29/08 (`type`, `direction`, `status`,
 * `from`, `to`) - chi la khong co cho nao gui chung len. Mot phan tinh nang da
 * xong, da co test, va vo hinh voi nguoi dung.
 *
 * <p>Component nay khong giu state: `value` va `onChange` do man hinh nam. Ly do
 * la bo loc va con tro phan trang phai doi CUNG NHAU - doi mot bo loc ma quen
 * dat lai cursor thi trang hai cua bo loc cu bi noi vao ket qua cua bo loc moi.
 * De state o day thi cho nao dat lai cursor se cach cho nao doi bo loc mot lop.
 */

const LOAI = [
  { value: '', label: 'Tất cả' },
  { value: 'DEPOSIT', label: 'Nạp tiền' },
  { value: 'TRANSFER', label: 'Chuyển tiền' },
]

const CHIEU = [
  { value: '', label: 'Tất cả' },
  { value: 'IN', label: 'Tiền vào' },
  { value: 'OUT', label: 'Tiền ra' },
]

const TRANG_THAI = [
  { value: '', label: 'Tất cả' },
  { value: 'SUCCESS', label: 'Thành công' },
  { value: 'FAILED', label: 'Thất bại' },
]

function NhomNut({ id, nhan, cac, value, onPick, disabled }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={`${id}-0`}>{nhan}</Label>
      <div role="group" aria-label={nhan} className="flex flex-wrap gap-1.5">
        {cac.map((o, i) => (
          <button
            key={o.value || 'all'}
            id={`${id}-${i}`}
            type="button"
            disabled={disabled}
            // aria-pressed noi trang thai bat/tat cho trinh doc man hinh. Chi
            // to mau thi nguoi khong nhin thay man hinh khong biet cai nao dang
            // duoc chon.
            aria-pressed={value === o.value}
            onClick={() => onPick(o.value)}
            className={
              'rounded-full border px-3 py-1 text-xs transition-colors disabled:opacity-50 ' +
              (value === o.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:bg-accent')
            }
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function TransactionFilters({ value, onChange, disabled = false }) {
  const set = (khoa) => (v) => onChange({ ...value, [khoa]: v })

  // Chuoi rong = khong loc. Dem so bo loc dang bat de biet co hien nut Xoa khong.
  const dangBat = Object.values(value).filter(Boolean).length

  return (
    <div className="mb-4 grid gap-4 rounded-xl border border-border bg-muted/40 p-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <NhomNut id="f-type" nhan="Loại" cac={LOAI} value={value.type} onPick={set('type')} disabled={disabled} />
        <NhomNut id="f-dir" nhan="Chiều" cac={CHIEU} value={value.direction} onPick={set('direction')} disabled={disabled} />
        <NhomNut id="f-status" nhan="Trạng thái" cac={TRANG_THAI} value={value.status} onPick={set('status')} disabled={disabled} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="f-from">Từ ngày</Label>
          <Input
            id="f-from"
            type="date"
            value={value.fromDate}
            onChange={(e) => set('fromDate')(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="f-to">Đến ngày</Label>
          <Input
            id="f-to"
            type="date"
            value={value.toDate}
            onChange={(e) => set('toDate')(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      {dangBat > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="justify-self-start"
          onClick={() => onChange({ type: '', direction: '', status: '', fromDate: '', toDate: '' })}
        >
          <X className="size-4" aria-hidden="true" />
          Xoá bộ lọc ({dangBat})
        </Button>
      )}
    </div>
  )
}
