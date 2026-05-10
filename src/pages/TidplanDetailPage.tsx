import { useEffect, useState } from 'react'
import { Calendar } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Forslag, ForslagFas } from '../lib/types'
import { Loading } from '../components/Loading'
import { EmptyState } from '../components/EmptyState'
import { fmtDate, fmtDateLong } from '../lib/format'

interface Props {
  forslagId: string
}

export function TidplanDetailPage({ forslagId }: Props) {
  const [forslag, setForslag] = useState<Forslag | null>(null)
  const [faser, setFaser] = useState<ForslagFas[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      setError(null)
      const [{ data: f, error: fErr }, { data: fs, error: fsErr }] = await Promise.all([
        supabase.from('forslag').select('*').eq('id', forslagId).maybeSingle(),
        supabase.from('forslag_faser').select('*').eq('forslag_id', forslagId).order('sortering'),
      ])
      if (fErr) { setError(fErr.message); return }
      if (!f) { setError('Förslaget hittades inte.'); return }
      if (fsErr) { setError(fsErr.message); return }
      setForslag(f as Forslag)
      setFaser((fs ?? []) as ForslagFas[])
    })()
  }, [forslagId])

  if (error) return <div className="px-5 py-6 text-sm text-danger">{error}</div>
  if (!forslag || !faser) return <Loading />

  const withDates = faser.filter((f) => f.start_datum || f.slut_datum)

  return (
    <div className="flex flex-col">
      <div className="px-5 pt-5 pb-3 border-b border-border">
        <p className="text-[11px] uppercase tracking-widest text-muted">{forslag.forslag_nummer ?? 'Förslag'}</p>
        <h2 className="text-xl font-semibold text-fg mt-1">{forslag.titel}</h2>
      </div>

      {faser.length === 0 ? (
        <EmptyState icon={<Calendar size={28} />} title="Inga faser" description="Förslaget innehåller inga faser." />
      ) : (
        <ol className="px-5 py-4 space-y-4">
          {faser.map((f, i) => (
            <li key={f.id} className="flex gap-3">
              <div className="flex flex-col items-center pt-1.5">
                <span className="h-7 w-7 rounded-full bg-accent text-accent-fg text-xs font-semibold flex items-center justify-center">
                  {i + 1}
                </span>
                {i < faser.length - 1 && <span className="flex-1 w-px bg-border my-1" />}
              </div>
              <div className="flex-1 min-w-0 pb-2">
                <p className="text-sm font-medium text-fg">{f.namn || '(utan namn)'}</p>
                <p className="text-xs text-muted mt-0.5">
                  {f.start_datum ? fmtDateLong(f.start_datum) : '—'}
                  {' – '}
                  {f.slut_datum ? fmtDateLong(f.slut_datum) : '—'}
                </p>
                {f.beskrivning && (
                  <p className="text-xs text-fg mt-1.5 whitespace-pre-wrap">{f.beskrivning}</p>
                )}
              </div>
            </li>
          ))}
          {withDates.length === 0 && (
            <p className="text-xs text-subtle">Inga datum är inlagda på faserna.</p>
          )}
        </ol>
      )}

      {withDates.length >= 2 && (
        <p className="px-5 pb-6 text-xs text-subtle">
          Förslagets period: {fmtDate(withDates[0].start_datum)} – {fmtDate(withDates[withDates.length - 1].slut_datum)}
        </p>
      )}
    </div>
  )
}
