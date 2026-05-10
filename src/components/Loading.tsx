import { Loader2 } from 'lucide-react'

export function Loading({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-6 py-12 text-muted">
      <Loader2 size={18} className="animate-spin" />
      <span className="text-xs">{label ?? 'Laddar…'}</span>
    </div>
  )
}
