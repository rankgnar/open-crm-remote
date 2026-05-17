import { useEffect, useMemo, useState } from 'react'
import { Search, Briefcase } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNav } from '../lib/navigation'
import type { Farg, Kund, Projekt, ProjektStatusar } from '../lib/types'
import { FARG_DOT } from '../lib/types'
import { ListRow } from '../components/ListRow'
import { Loading } from '../components/Loading'
import { EmptyState } from '../components/EmptyState'
import { fmtDate } from '../lib/format'

interface ProjektWithKund extends Projekt {
  kund: Pick<Kund, 'namn' | 'kundnummer'> | null
}

const FARG_BADGE: Record<Farg, string> = {
  emerald: 'badge-success',
  amber:   'badge-warn',
  red:     'badge-danger',
  blue:    'badge-neutral',
  muted:   'badge-neutral',
}

export function ProjektListPage() {
  const { push } = useNav()
  const [items, setItems] = useState<ProjektWithKund[] | null>(null)
  const [statusar, setStatusar] = useState<ProjektStatusar[]>([])
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  useEffect(() => { void load() }, [])

  async function load() {
    setError(null)
    const [projRes, statRes] = await Promise.all([
      supabase.from('projekt').select('*, kund:kunder(namn, kundnummer)').order('skapad_at', { ascending: false }),
      supabase.from('projekt_statusar').select('*').order('sortering'),
    ])
    if (projRes.error) setError(projRes.error.message)
    else setItems((projRes.data ?? []) as unknown as ProjektWithKund[])
    if (!statRes.error) setStatusar((statRes.data ?? []) as ProjektStatusar[])
  }

  const statusFargMap = useMemo(() => {
    const m: Record<string, Farg> = {}
    for (const s of statusar) m[s.namn] = s.farg
    return m
  }, [statusar])

  const filtered = useMemo(() => {
    if (!items) return []
    let result = items
    if (statusFilter) result = result.filter((p) => p.status === statusFilter)
    const q = search.trim().toLowerCase()
    if (!q) return result
    return result.filter((p) =>
      [p.namn, p.projekt_nummer, p.kund?.namn, p.arbetsplats_stad]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    )
  }, [items, search, statusFilter])

  if (error) return <div className="px-5 py-6 text-sm text-danger">{error}</div>
  if (!items) return <Loading />

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 bg-bg/95 backdrop-blur border-b border-border">
        <div className="px-3 pt-2 pb-2">
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

        {statusar.length > 0 && (
          <div className="flex gap-2 px-3 pb-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <button
              type="button"
              onClick={() => setStatusFilter(null)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === null
                  ? 'bg-elevated text-fg'
                  : 'text-muted active:bg-hover'
              }`}
            >
              Alla
            </button>
            {statusar.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatusFilter(statusFilter === s.namn ? null : s.namn)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === s.namn
                    ? 'bg-elevated text-fg'
                    : 'text-muted active:bg-hover'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${FARG_DOT[s.farg]}`} />
                {s.namn}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={28} />}
          title={search || statusFilter ? 'Inga träffar' : 'Inga projekt än'}
        />
      ) : (
        <ul>
          {filtered.map((p) => {
            const farg = statusFargMap[p.status]
            const badgeClass = farg ? FARG_BADGE[farg] : 'badge-neutral'
            const sub = [p.kund?.namn, p.arbetsplats_stad, fmtDate(p.startdatum)].filter(Boolean).join(' · ')
            return (
              <li key={p.id}>
                <ListRow
                  title={p.namn}
                  subtitle={
                    <span className="flex items-center gap-2">
                      <span className={`badge ${badgeClass}`}>{p.status}</span>
                      {sub && <span className="truncate">{sub}</span>}
                    </span>
                  }
                  meta={p.projekt_nummer ?? undefined}
                  onClick={() => push({ kind: 'projekt.detail', id: p.id })}
                />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
