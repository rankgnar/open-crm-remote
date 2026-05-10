import { useEffect, useMemo, useState } from 'react'
import { Search, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNav } from '../lib/navigation'
import type { Kund } from '../lib/types'
import { ListRow } from '../components/ListRow'
import { Loading } from '../components/Loading'
import { EmptyState } from '../components/EmptyState'

export function KunderListPage() {
  const { push } = useNav()
  const [kunder, setKunder] = useState<Kund[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => { void load() }, [])

  async function load() {
    setError(null)
    const { data, error: e } = await supabase
      .from('kunder')
      .select('*')
      .order('namn', { ascending: true })
    if (e) setError(e.message)
    else setKunder((data ?? []) as Kund[])
  }

  const filtered = useMemo(() => {
    if (!kunder) return []
    const q = search.trim().toLowerCase()
    if (!q) return kunder
    return kunder.filter((k) =>
      [k.namn, k.kundnummer, k.email, k.telefon, k.org_nummer]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    )
  }, [kunder, search])

  if (error) {
    return (
      <div className="px-5 py-6 text-sm text-danger">
        {error}
      </div>
    )
  }

  if (!kunder) return <Loading />

  return (
    <div className="flex flex-col">
      <div className="px-3 py-2 sticky top-0 z-10 bg-bg/95 backdrop-blur border-b border-border">
        <label className="relative block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
          <input
            className="input pl-9"
            type="search"
            placeholder="Sök kund…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title={search ? 'Inga träffar' : 'Inga kunder än'}
          description={search ? 'Prova ett annat sökord.' : undefined}
        />
      ) : (
        <ul>
          {filtered.map((k) => (
            <li key={k.id}>
              <ListRow
                title={k.namn}
                subtitle={[k.stad, k.telefon].filter(Boolean).join(' · ') || k.email || '—'}
                meta={k.kundnummer ?? undefined}
                onClick={() => push({ kind: 'kund.detail', id: k.id })}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
