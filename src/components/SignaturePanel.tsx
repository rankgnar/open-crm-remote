import type { ReactNode } from 'react'
import { CheckCircle2, PenSquare } from 'lucide-react'
import { fmtDateTime } from '../lib/format'

interface SignaturePanelProps {
  status: string
  acceptedStatuses: string[]
  godkand_av: string | null
  godkand_datum: string | null
  signatur_data: string | null
}

export function SignaturePanel({
  status,
  acceptedStatuses,
  godkand_av,
  godkand_datum,
  signatur_data,
}: SignaturePanelProps) {
  const isSigned = acceptedStatuses.includes(status) && (signatur_data || godkand_av)

  return (
    <section className="px-5 py-4 border-t border-border">
      <p className="text-[11px] uppercase tracking-widest text-muted mb-3">Signering</p>

      {!isSigned ? (
        <p className="text-xs text-subtle italic">
          Inte signerad ännu. Tryck Signera nu för att signera direkt med kunden.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <TimelineEvent
            color="emerald"
            icon={<CheckCircle2 size={12} />}
            label="Signerat"
            datetime={godkand_datum ? fmtDateTime(godkand_datum) : ''}
            sub={godkand_av ? `Av ${godkand_av}` : undefined}
            extra={
              <span className="inline-flex items-center gap-1 text-[10.5px] text-emerald-400 mt-1">
                <PenSquare size={10} />
                Direkt på plats
              </span>
            }
            isLast
          />

          {signatur_data && (
            <div className="rounded-md bg-white p-3 border border-border">
              <img src={signatur_data} alt="Signatur" className="w-full h-auto" />
            </div>
          )}
        </div>
      )}
    </section>
  )
}

type EventColor = 'amber' | 'blue' | 'emerald' | 'red'

const COLOR_MAP: Record<EventColor, string> = {
  amber:   'bg-amber-400/15 text-amber-400 border-amber-400/30',
  blue:    'bg-blue-400/15 text-blue-400 border-blue-400/30',
  emerald: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30',
  red:     'bg-red-400/15 text-red-400 border-red-400/30',
}

interface TimelineEventProps {
  icon: ReactNode
  label: string
  datetime: string
  sub?: string
  extra?: ReactNode
  color: EventColor
  isLast?: boolean
}

function TimelineEvent({ icon, label, datetime, sub, extra, color, isLast }: TimelineEventProps) {
  return (
    <div className="flex gap-3 relative">
      <div className="flex flex-col items-center shrink-0">
        <div className={`size-6 rounded-full border flex items-center justify-center ${COLOR_MAP[color]}`}>
          {icon}
        </div>
        {!isLast && <div className="w-px flex-1 bg-border my-1 min-h-[18px]" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-fg leading-tight">{label}</p>
        {datetime && <p className="text-[10.5px] text-subtle tabular-nums mt-0.5">{datetime}</p>}
        {sub && <p className="text-[10.5px] text-muted truncate mt-0.5">{sub}</p>}
        {extra}
      </div>
    </div>
  )
}
