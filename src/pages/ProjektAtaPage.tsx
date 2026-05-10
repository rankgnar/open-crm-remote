import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNav } from '../lib/navigation'
import type { Ata } from '../lib/types'
import { Loading } from '../components/Loading'
import { ListRow } from '../components/ListRow'
import { EmptyState } from '../components/EmptyState'
import { fmtMoney } from '../lib/format'

export function ProjektAtaPage({ projektId }: { projektId: string }) {
  const { push } = useNav()
  const [items, setItems] = useState<Ata[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
    supabase
      .from('ata')
      .select('*')
      .eq('projekt_id', projektId)
      .order('skapad_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setItems((data ?? []) as Ata[])
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
          onClick={() => push({ kind: 'ata.create', projektId })}
        >
          <Plus size={16} />
          Ny ÄTA
        </button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="Inga ÄTA än" description="Skapa en ÄTA direkt från fältet." />
      ) : (
        <ul>
          {items.map((a) => (
            <li key={a.id}>
              <ListRow
                title={a.titel || `ÄTA ${a.ata_nummer ?? ''}`}
                subtitle={
                  <span className="flex items-center gap-2">
                    <span className="badge badge-neutral">{a.status}</span>
                    <span>{fmtMoney(a.belopp_total)}</span>
                  </span>
                }
                meta={a.ata_nummer ?? undefined}
                onClick={() => push({ kind: 'ata.detail', id: a.id })}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
