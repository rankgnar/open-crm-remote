import { useEffect, useMemo, useState } from 'react'
import { Search, MessageCircle } from 'lucide-react'
import { useNav } from '../lib/navigation'
import { Loading } from '../components/Loading'
import { EmptyState } from '../components/EmptyState'
import { listChatSummary, subscribeAll, type ChatThreadSummary } from '../lib/chat'

export function ChatListPage() {
  const { push } = useNav()
  const [rows, setRows] = useState<ChatThreadSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await listChatSummary()
        if (!cancelled) setRows(data)
      } catch (e) {
        if (!cancelled) setError((e as Error).message)
      }
    }

    void load()
    const unsubscribe = subscribeAll(() => { void load() })

    function onVisibility() { if (!document.hidden) void load() }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      unsubscribe()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const sorted = useMemo(() => {
    if (!rows) return []
    return [...rows].sort((a, b) => {
      const ta = a.last_at ? Date.parse(a.last_at) : 0
      const tb = b.last_at ? Date.parse(b.last_at) : 0
      if (ta !== tb) return tb - ta
      return a.namn.localeCompare(b.namn, 'sv')
    })
  }, [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sorted
    return sorted.filter((r) =>
      [r.namn, r.email, r.last_innehall].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)),
    )
  }, [sorted, search])

  if (error) {
    return <div className="px-5 py-6 text-sm text-danger">{error}</div>
  }

  if (!rows) return <Loading />

  return (
    <div className="flex flex-col">
      <div className="px-3 py-2 sticky top-0 z-10 bg-bg/95 backdrop-blur border-b border-border">
        <label className="relative block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
          <input
            className="input pl-9"
            type="search"
            placeholder="Sök personal…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<MessageCircle size={28} />}
          title={search ? 'Inga träffar' : 'Inga anställda'}
          description={search ? 'Prova ett annat sökord.' : undefined}
        />
      ) : (
        <ul>
          {filtered.map((r) => (
            <li key={r.personal_id}>
              <Row
                row={r}
                onOpen={() => push({ kind: 'chat.thread', personalId: r.personal_id, namn: r.namn })}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface RowProps {
  row: ChatThreadSummary
  onOpen: () => void
}

function Row({ row, onOpen }: RowProps) {
  const subtitle = row.last_innehall
    ? `${row.last_fran_admin ? 'Du: ' : ''}${truncate(row.last_innehall, 60)}`
    : 'Ingen konversation än'

  return (
    <button type="button" onClick={onOpen} className="list-row">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium truncate text-fg">{row.namn}</p>
          {row.last_at && (
            <span className="text-xs text-muted shrink-0 tabular-nums">
              {formatDate(row.last_at)}
            </span>
          )}
        </div>
        <p className={`text-xs truncate mt-0.5 ${row.unread_count > 0 ? 'text-fg font-medium' : 'text-muted'}`}>
          {subtitle}
        </p>
      </div>

      {row.unread_count > 0 && (
        <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-accent text-accent-fg text-[11px] font-semibold flex items-center justify-center tabular-nums">
          {row.unread_count > 99 ? '99+' : row.unread_count}
        </span>
      )}
    </button>
  )
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('sv-SE', { day: '2-digit', month: 'short' })
}
