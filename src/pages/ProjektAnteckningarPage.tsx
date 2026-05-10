import { useEffect, useState } from 'react'
import { Plus, StickyNote } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNav } from '../lib/navigation'
import type { ProjektAnteckning, Farg } from '../lib/types'
import { FARG_DOT } from '../lib/types'
import { Loading } from '../components/Loading'
import { EmptyState } from '../components/EmptyState'
import { fmtDateTime } from '../lib/format'

export function ProjektAnteckningarPage({ projektId }: { projektId: string }) {
  const { push } = useNav()
  const [items, setItems] = useState<ProjektAnteckning[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
    supabase
      .from('projekt_anteckningar')
      .select('*')
      .eq('projekt_id', projektId)
      .order('skapad_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setItems((data ?? []) as ProjektAnteckning[])
      })
  }, [projektId])

  if (error) return <div className="px-5 py-6 text-sm text-danger">{error}</div>
  if (!items) return <Loading />

  return (
    <div className="flex flex-col">
      <div className="px-3 py-2 border-b border-border bg-bg sticky top-0 z-10">
        <button
          type="button"
          className="btn btn-primary w-full"
          onClick={() => push({ kind: 'projekt.anteckning.edit', projektId })}
        >
          <Plus size={16} />
          Ny anteckning
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<StickyNote size={28} />}
          title="Inga anteckningar än"
          description="Tryck på Ny anteckning för att skapa en."
        />
      ) : (
        <div className="relative py-4">
          <div className="absolute left-[26px] top-4 bottom-4 w-px bg-border" />

          <ul>
            {items.map((a) => {
              const farg = (a.farg as Farg) ?? 'muted'
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => push({ kind: 'projekt.anteckning.edit', projektId, anteckningId: a.id })}
                    className="w-full text-left flex gap-3 px-5 pb-5 last:pb-0 active:bg-hover transition-colors"
                  >
                    <span className={`relative z-10 mt-1.5 size-3 rounded-full shrink-0 ring-2 ring-bg ${FARG_DOT[farg]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-medium text-fg truncate">
                          {a.titel || '(utan rubrik)'}
                        </p>
                        <span className="text-[11px] text-subtle shrink-0">{fmtDateTime(a.skapad_at)}</span>
                      </div>
                      {a.innehall && (
                        <p className="text-xs text-muted mt-1 line-clamp-2 whitespace-pre-wrap">
                          {a.innehall}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
