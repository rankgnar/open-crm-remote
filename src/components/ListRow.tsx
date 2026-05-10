import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

interface ListRowProps {
  title: string
  subtitle?: ReactNode
  meta?: ReactNode
  leading?: ReactNode
  trailing?: ReactNode
  onClick?: () => void
  done?: boolean
}

export function ListRow({ title, subtitle, meta, leading, trailing, onClick, done }: ListRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="list-row"
    >
      {leading && <div className="shrink-0">{leading}</div>}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-medium truncate ${done ? 'text-muted line-through' : 'text-fg'}`}>{title}</p>
          {meta && <span className="text-xs text-muted shrink-0">{meta}</span>}
        </div>
        {subtitle && (
          <p className="text-xs text-muted truncate mt-0.5">{subtitle}</p>
        )}
      </div>

      {trailing ?? <ChevronRight size={18} className="text-subtle shrink-0" />}
    </button>
  )
}
