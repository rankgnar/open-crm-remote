import { ShieldAlert, LogOut } from 'lucide-react'

interface Props {
  email?: string | null
  onSignOut: () => void
}

export function AccessDeniedPage({ email, onSignOut }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg text-center px-8 gap-4 safe-top safe-bottom">
      <div className="h-14 w-14 rounded-2xl bg-danger-soft text-danger flex items-center justify-center">
        <ShieldAlert size={28} />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-fg">Åtkomst nekad</h1>
        <p className="text-sm text-muted">
          {email ? `${email} har inte adminbehörighet.` : 'Kontot saknar adminbehörighet.'}
        </p>
      </div>
      <button type="button" onClick={onSignOut} className="btn btn-ghost mt-2">
        <LogOut size={15} />
        Logga ut
      </button>
    </div>
  )
}
