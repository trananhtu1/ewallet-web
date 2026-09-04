import { Trash2, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  useDeleteBeneficiaryMutation,
  useGetBeneficiariesQuery,
  useSaveBeneficiaryMutation,
} from '../store/walletApi'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'

/**
 * So dia chi nguoi nhan: chon mot cai de dien san vao form chuyen tien.
 *
 * <p>Ten hien o day la ten <b>nguoi luu tu dat</b>, khong phai ten that cua chu
 * vi - backend co y khong tra ve ten that, vi hien ten nguoi la cho bat ky ai
 * doan trung so vi la mot duong ro ri danh tinh.
 */
export default function BeneficiaryPicker({ onPick }) {
  const { data: danhSach, isLoading } = useGetBeneficiariesQuery()
  const [luu, { isLoading: dangLuu }] = useSaveBeneficiaryMutation()
  const [xoa] = useDeleteBeneficiaryMutation()

  const [moForm, setMoForm] = useState(false)
  const [walletId, setWalletId] = useState('')
  const [label, setLabel] = useState('')
  const [loi, setLoi] = useState(null)

  async function themMoi(event) {
    event.preventDefault()
    setLoi(null)

    try {
      await luu({ walletId: Number(walletId), label: label.trim() }).unwrap()
      setWalletId('')
      setLabel('')
      setMoForm(false)
      toast.success('Đã lưu người nhận')
    } catch (error) {
      // Re nhanh theo CODE, khong theo message.
      if (error.code === 'BENEFICIARY_ALREADY_SAVED') setLoi('Ví này đã có trong danh sách')
      else if (error.code === 'WALLET_NOT_FOUND') setLoi('Không tìm thấy ví này')
      else if (error.code === 'SAME_WALLET') setLoi('Không thể lưu chính ví của bạn')
      else setLoi(error.message)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold">Người nhận đã lưu</h2>
          <Button type="button" variant="ghost" size="sm" onClick={() => setMoForm((v) => !v)}>
            <UserPlus className="size-4" aria-hidden="true" />
            Thêm
          </Button>
        </div>

        {moForm && (
          <form onSubmit={themMoi} className="mb-4 grid gap-3 rounded-xl bg-muted/40 p-3" noValidate>
            <div className="grid gap-1.5">
              <Label htmlFor="ben-wallet">Mã ví</Label>
              <Input
                id="ben-wallet"
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                inputMode="numeric"
                placeholder="2"
                disabled={dangLuu}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ben-label">Tên gợi nhớ</Label>
              <Input
                id="ben-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={60}
                placeholder="Mẹ"
                disabled={dangLuu}
              />
            </div>

            <p className="m-0 text-sm font-medium text-destructive empty:hidden" aria-live="polite">
              {loi}
            </p>

            <Button type="submit" size="sm" disabled={dangLuu || !walletId || !label.trim()}>
              {dangLuu ? 'Đang lưu…' : 'Lưu'}
            </Button>
          </form>
        )}

        {isLoading && <p className="text-sm text-muted-foreground">Đang tải…</p>}

        {!isLoading && !danhSach?.length && (
          <p className="py-3 text-sm text-muted-foreground">
            Chưa lưu người nhận nào. Lưu lại để lần sau không phải gõ mã ví.
          </p>
        )}

        <ul className="m-0 list-none p-0">
          {danhSach?.map((b) => (
            <li
              key={b.id}
              className="flex items-center gap-2 border-b border-border py-2 last:border-0 last:pb-0"
            >
              {/* Ca dong la nut chon: vung bam rong hon mot chu link nhieu. */}
              <button
                type="button"
                onClick={() => onPick(String(b.walletId))}
                className="flex min-w-0 flex-1 flex-col items-start rounded-lg px-2 py-1 text-left hover:bg-accent"
              >
                <span className="truncate text-sm font-medium">{b.label}</span>
                <span className="text-xs text-muted-foreground">Ví #{b.walletId}</span>
              </button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Xoá ${b.label}`}
                onClick={() => xoa(b.id)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
