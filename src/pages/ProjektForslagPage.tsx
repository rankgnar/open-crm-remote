import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNav } from '../lib/navigation'
import type { Forslag } from '../lib/types'
import { Loading } from '../components/Loading'
import { ListRow } from '../components/ListRow'
import { EmptyState } from '../components/EmptyState'
import { fmtDate } from '../lib/format'

export function ProjektForslagPage({ projektId }: { projektId: string }) {
  const { push } = useNav()
  const [items, setItems] = useState<Forslag[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
    supabase
      .from('forslag')
      .select('*')
      .eq('projekt_id', projektId)
      .order('skapad_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setItems((data ?? []) as Forslag[])
      })
  }, [projektId])

  if (error) return <div className="px-5 py-6 text-sm text-danger">{error}</div>
  if (!items) return <Loading />
  if (items.length === 0) {
    return <EmptyState icon={<FileText size={28} />} title="Inga förslag än" />
  }

  return (
    <ul>
      {items.map((f) => (
        <li key={f.id}>
          <ListRow
            title={f.titel || `Förslag ${f.forslag_nummer ?? ''}`}
            subtitle={
              <span className="flex items-center gap-2">
                <span className="badge badge-neutral">{f.status}</span>
                {f.giltig_till && <span>Giltigt t.o.m. {fmtDate(f.giltig_till)}</span>}
              </span>
            }
            meta={f.forslag_nummer ?? undefined}
            onClick={() => push({ kind: 'forslag.detail', projektId, forslagId: f.id })}
            trailing={
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  push({ kind: 'tidplan.detail', projektId, forslagId: f.id })
                }}
                className="btn btn-ghost text-xs px-2.5 py-1.5 min-h-0"
              >
                Tidplan
              </button>
            }
          />
        </li>
      ))}
    </ul>
  )
}
