import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Menu, X, LogOut, ChevronRight, Calculator, Sun, Moon, ReceiptText } from 'lucide-react'
import { useNav } from '../lib/navigation'
import { useTheme } from '../lib/theme'

interface MoreMenuProps {
  email?: string | null
  onSignOut: () => void
}

export function MoreMenu({ email, onSignOut }: MoreMenuProps) {
  const [open, setOpen] = useState(false)
  const { push } = useNav()
  const { theme, toggle: toggleTheme } = useTheme()

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Lock body scroll while sheet is open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  function close() { setOpen(false) }

  function go(view: Parameters<typeof push>[0]) {
    close()
    push(view)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="icon-btn"
        aria-label="Mer"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Menu size={22} />
      </button>

      {open && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mer"
          className="fixed inset-0 z-50 bg-bg flex flex-col safe-top safe-bottom"
        >
          <header className="flex items-center gap-2 px-3 py-2 min-h-[52px] border-b border-border">
            <button
              type="button"
              onClick={close}
              className="icon-btn shrink-0"
              aria-label="Stäng"
            >
              <X size={22} />
            </button>
            <h1 className="text-base font-semibold text-fg">Mer</h1>
          </header>

          <div className="flex-1 overflow-auto">
            <div className="px-5 py-4 border-b border-border">
              <p className="text-[11px] uppercase tracking-widest text-muted">Inloggad som</p>
              <p className="text-sm text-fg mt-1 truncate">{email ?? '—'}</p>
            </div>

            <nav>
              <MenuRow
                icon={<ReceiptText size={18} />}
                label="Kvitto"
                description="Hantera kontantkvitton och kvitton från mobilen"
                onClick={() => go({ kind: 'kvitto.list' })}
              />
              <MenuRow
                icon={<Calculator size={18} />}
                label="Revisor"
                description="Deadlines, anteckningar och dokument"
                onClick={() => go({ kind: 'revisor' })}
              />
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-5 py-4 border-b border-border active:bg-hover transition-colors text-left"
              >
                <span className="h-9 w-9 rounded-lg bg-elevated text-muted flex items-center justify-center shrink-0">
                  {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-fg">Tema</span>
                  <span className="block text-xs text-muted mt-0.5">
                    {theme === 'dark' ? 'Mörkt läge' : 'Ljust läge'}
                  </span>
                </span>
                <span className="text-[11px] text-muted">
                  {theme === 'dark' ? 'Byt till ljust' : 'Byt till mörkt'}
                </span>
              </button>
            </nav>
          </div>

          <div className="px-5 py-3 border-t border-border">
            <button
              type="button"
              onClick={() => { close(); onSignOut() }}
              className="btn btn-ghost w-full"
            >
              <LogOut size={16} />
              Logga ut
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

function MenuRow({
  icon,
  label,
  description,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  description?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-4 border-b border-border active:bg-hover transition-colors text-left"
    >
      <span className="h-9 w-9 rounded-lg bg-elevated text-muted flex items-center justify-center shrink-0">
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-fg">{label}</span>
        {description && <span className="block text-xs text-muted mt-0.5 truncate">{description}</span>}
      </span>
      <ChevronRight size={16} className="text-subtle shrink-0" />
    </button>
  )
}
