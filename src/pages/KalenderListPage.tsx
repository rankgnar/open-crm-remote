import { useEffect, useState } from 'react'
import { Plus, Calendar } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNav } from '../lib/navigation'
import type { KalenderEvent } from '../lib/types'
import { Loading } from '../components/Loading'
import { EmptyState } from '../components/EmptyState'
import { ListRow } from '../components/ListRow'
import { fmtDateLong, fmtTime, localDay } from '../lib/format'

const DAYS_BACK = 1
const DAYS_AHEAD = 60

export function KalenderListPage() {
  const { push } = useNav()
  const [events, setEvents] = useState<KalenderEvent[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { void load() }, [])

  async function load() {
    setError(null)
    const from = new Date()
    from.setDate(from.getDate() - DAYS_BACK)
    const to = new Date()
    to.setDate(to.getDate() + DAYS_AHEAD)
    const { data, error: e } = await supabase
      .from('kalender_events')
      .select('*')
      .gte('start', from.toISOString())
      .lte('start', to.toISOString())
      .order('start', { ascending: true })
    if (e) setError(e.message)
    else setEvents((data ?? []) as KalenderEvent[])
  }

  if (error) return <div className="px-5 py-6 text-sm text-danger">{error}</div>
  if (!events) return <Loading />

  const groups = groupByDay(events)

  return (
    <div className="flex flex-col">
      <div className="px-3 py-2 border-b border-border bg-bg sticky top-0 z-10">
        <button
          type="button"
          className="btn btn-primary w-full"
          onClick={() => push({ kind: 'kalender.edit' })}
        >
          <Plus size={16} />
          Ny händelse
        </button>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={<Calendar size={28} />}
          title="Inga händelser"
          description={`Visar de närmaste ${DAYS_AHEAD} dagarna.`}
        />
      ) : (
        groups.map(({ day, items }) => (
          <section key={day}>
            <header className="px-5 py-2 bg-elevated/60 text-[11px] uppercase tracking-widest text-muted">
              {fmtDateLong(day)}
            </header>
            <ul>
              {items.map((ev) => (
                <li key={ev.id}>
                  <ListRow
                    leading={
                      <span
                        className="h-9 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: ev.farg, opacity: ev.slutford ? 0.4 : 1 }}
                      />
                    }
                    title={ev.titel}
                    done={ev.slutford}
                    subtitle={
                      <span className="flex items-center gap-2">
                        <span>
                          {ev.hel_dag
                            ? 'Heldag'
                            : `${fmtTime(ev.start)}${ev.slut ? `–${fmtTime(ev.slut)}` : ''}`}
                        </span>
                        {ev.plats && <span className="truncate">· {ev.plats}</span>}
                      </span>
                    }
                    onClick={() => push({ kind: 'kalender.detail', id: ev.id })}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}

function groupByDay(events: KalenderEvent[]): Array<{ day: string; items: KalenderEvent[] }> {
  const byDay = new Map<string, KalenderEvent[]>()
  for (const ev of events) {
    const day = localDay(ev.start)
    const existing = byDay.get(day)
    if (existing) existing.push(ev)
    else byDay.set(day, [ev])
  }
  return [...byDay.entries()].map(([day, items]) => ({ day, items }))
}
