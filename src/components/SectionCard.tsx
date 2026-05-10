import type { ReactNode } from 'react'

interface SectionCardProps {
  icon: ReactNode
  label: string
  count?: number | string | null
  onClick?: () => void
  disabled?: boolean
}

export function SectionCard({ icon, label, count, onClick, disabled }: SectionCardProps) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`card p-4 flex flex-col gap-3 text-left transition-colors ${
        disabled ? 'opacity-50 cursor-default' : 'hover:bg-hover active:bg-hover'
      }`}
    >
      <span className="h-10 w-10 rounded-lg bg-elevated text-muted flex items-center justify-center">
        {icon}
      </span>
      <span className="flex items-baseline justify-between gap-2 mt-auto">
        <span className="text-sm font-medium text-fg">{label}</span>
        {count != null && count !== '' && (
          <span className="text-lg font-semibold text-fg tabular-nums">{count}</span>
        )}
      </span>
    </button>
  )
}
