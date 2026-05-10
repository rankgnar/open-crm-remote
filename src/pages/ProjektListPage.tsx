import { useEffect, useMemo, useState } from 'react'
import { Search, Briefcase } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNav } from '../lib/navigation'
import type { Projekt, Kund } from '../lib/types'
import { ListRow } from '../components/ListRow'
import { Loading } from '../components/Loading'
import { EmptyState } from '../components/EmptyState'
import { fmtDate } from '../lib/format'

interface ProjektWithKund extends Projekt {
  kund: Pick<Kund, 'namn' | 'kundnummer'> | null
}

export function ProjektListPage() {
  const { push } = useNav()
  const [items, setItems] = useState<ProjektWithKund[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => { void load() }, [])

  async function load() {
    setError(null)
    const { data, error: e } = await supabase
      .from('projekt')
      .select('*, kund:kunder(namn, kundnummer)')
      .order('skapad_at', { ascending: false })
    if (e) setError(e.message)
    else setItems((data ?? []) as unknown as ProjektWithKund[])
  }

  const filtered = useMemo(() => {
    if (!items) return []
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((p) =>
      [p.namn, p.projekt_nummer, p.kund?.namn, p.arbetsplats_stad]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    )
  }, [items, search])

  if (error) return <div className="px-5 py-6 text-sm text-danger">{error}</div>
  if (!items) return <Loading />

  return (
    <div className="flex flex-col">
      <div className="px-3 py-2 sticky top-0 z-10 bg-bg/95 backdrop-blur border-b border-border">
        <label className="relative block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
          <input
            className="input pl-9"
            type="search"
            placeholder="Sök projekt…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={28} />}
          title={search ? 'Inga träffar' : 'Inga projekt än'}
        />
      ) : (
        <ul>
          {filtered.map((p) => (
            <li key={p.id}>
              <ListRow
                title={p.namn}
                subtitle={
                  <span className="flex items-center gap-2">
                    <span className="badge badge-neutral">{p.status}</span>
                    <span className="truncate">
                      {[p.kund?.namn, fmtDate(p.startdatum)].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                }
                meta={p.projekt_nummer ?? undefined}
                onClick={() => push({ kind: 'projekt.detail', id: p.id })}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
