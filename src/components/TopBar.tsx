import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'

interface TopBarProps {
  title: string
  subtitle?: string
  onBack?: () => void
  right?: ReactNode
}

export function TopBar({ title, subtitle, onBack, right }: TopBarProps) {
  return (
    <header className="safe-top sticky top-0 z-20 bg-bg/95 backdrop-blur border-b border-border">
      <div className="flex items-center gap-2 px-3 py-2 min-h-[52px]">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="icon-btn shrink-0"
            aria-label="Tillbaka"
          >
            <ChevronLeft size={22} />
          </button>
        ) : (
          <div className="w-2" />
        )}

        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-fg truncate leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted truncate leading-tight mt-0.5">{subtitle}</p>
          )}
        </div>

        {right && <div className="flex items-center gap-1 shrink-0">{right}</div>}
      </div>
    </header>
  )
}
