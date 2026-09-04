import { LogOut } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import AvatarUploader from '../components/AvatarUploader'
import KycCard from '../components/KycCard'
import ReconciliationCard from '../components/ReconciliationCard'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'

/**
 * Ca nhan: thong tin tai khoan, KYC, doi soat, dang xuat.
 *
 * <p>KYC va doi soat chuyen tu trang chu ve day. Ca hai deu la thu <b>xem mot
 * lan roi thoi</b> - de chung tren trang chu la bat nguoi dung cuon qua chung
 * moi lan mo app chi de xem so du.
 */
export default function ProfilePage() {
  const { session, signOut } = useAuth()

  return (
    <>
      <h1 className="mb-5 text-xl font-semibold tracking-tight">Cá nhân</h1>

      <div className="grid gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="mb-5 border-b border-border pb-5">
              <AvatarUploader />
            </div>

            <dl className="m-0 grid gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Họ tên</dt>
                <dd className="m-0 truncate font-medium">{session.fullName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Mã ví</dt>
                <dd className="m-0 font-medium">#{session.walletId}</dd>
              </div>
            </dl>

            <Button type="button" variant="outline" className="mt-5 w-full" onClick={signOut}>
              <LogOut className="size-4" aria-hidden="true" />
              Đăng xuất
            </Button>
          </CardContent>
        </Card>

        <KycCard />
        <ReconciliationCard />
      </div>
    </>
  )
}
