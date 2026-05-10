import { useEffect, useState } from 'react'
import { Pencil, Trash2, MapPin, Users, Briefcase, Link as LinkIcon, CheckCircle2, Circle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNav } from '../lib/navigation'
import type { KalenderEvent, Projekt } from '../lib/types'
import { Loading } from '../components/Loading'
import { fmtDateLong, fmtTime } from '../lib/format'

interface EventWithProjekt extends KalenderEvent {
  projekt: Pick<Projekt, 'id' | 'namn' | 'projekt_nummer'> | null
}

export function KalenderDetailPage({ id }: { id: string }) {
  const { push, pop } = useNav()
  const [ev, setEv] = useState<EventWithProjekt | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void (async () => {
      setError(null)
      const { data, error: e } = await supabase
        .from('kalender_events')
        .select('*, projekt:projekt_id(id, namn, projekt_nummer)')
        .eq('id', id)
        .maybeSingle()
      if (e) { setError(e.message); return }
      if (!data) { setError('Händelsen hittades inte.'); return }
      setEv(data as unknown as EventWithProjekt)
    })()
  }, [id])

  async function remove() {
    if (!confirm('Radera händelsen?')) return
    setBusy(true)
    const { error: e } = await supabase.from('kalender_events').delete().eq('id', id)
    setBusy(false)
    if (e) { setError(e.message); return }
    pop()
  }

  async function toggleSlutford() {
    if (!ev) return
    const next = !ev.slutford
    setBusy(true)
    const { error: e } = await supabase
      .from('kalender_events')
      .update({ slutford: next })
      .eq('id', id)
    setBusy(false)
    if (e) { setError(e.message); return }
    setEv({ ...ev, slutford: next })
  }

  if (error) return <div className="px-5 py-6 text-sm text-danger">{error}</div>
  if (!ev) return <Loading />

  return (
    <div className="flex flex-col">
      <div className="px-5 pt-5 pb-3 border-b border-border">
        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: ev.farg }} />
        <h2 className={`text-xl font-semibold mt-2 ${ev.slutford ? 'text-muted line-through' : 'text-fg'}`}>{ev.titel}</h2>
        <p className="text-sm text-muted mt-1">
          {fmtDateLong(ev.start)}
          {!ev.hel_dag && ` · ${fmtTime(ev.start)}–${fmtTime(ev.slut)}`}
          {ev.hel_dag && ' · Heldag'}
        </p>
      </div>

      <section className="px-5 py-4 border-b border-border space-y-3">
        {ev.plats && <Field icon={<MapPin size={16} />} label="Plats" value={ev.plats} />}
        {ev.projekt && (
          <button
            type="button"
            onClick={() => ev.projekt && push({ kind: 'projekt.detail', id: ev.projekt.id })}
            className="flex items-center gap-3 w-full text-left"
          >
            <span className="h-9 w-9 rounded-lg bg-elevated text-muted flex items-center justify-center">
              <Briefcase size={16} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[11px] uppercase tracking-widest text-muted">Projekt</span>
              <span className="block text-sm text-fg truncate">{ev.projekt.namn}</span>
            </span>
          </button>
        )}
        {ev.deltagare && ev.deltagare.length > 0 && (
          <Field icon={<Users size={16} />} label="Deltagare" value={ev.deltagare.join(', ')} />
        )}
        {ev.url && (
          <a href={ev.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-accent">
            <span className="h-9 w-9 rounded-lg bg-accent-soft flex items-center justify-center">
              <LinkIcon size={16} />
            </span>
            <span className="flex-1 min-w-0 truncate text-sm">{ev.url}</span>
          </a>
        )}
      </section>

      {ev.beskrivning && (
        <section className="px-5 py-4 border-b border-border">
          <p className="text-[11px] uppercase tracking-widest text-muted mb-2">Beskrivning</p>
          <p className="text-sm text-fg whitespace-pre-wrap">{ev.beskrivning}</p>
        </section>
      )}

      <div className="p-5 flex flex-col gap-2">
        <button
          type="button"
          className={`btn ${ev.slutford ? 'btn-ghost' : 'btn-primary'}`}
          onClick={toggleSlutford}
          disabled={busy}
        >
          {ev.slutford ? <CheckCircle2 size={16} /> : <Circle size={16} />}
          {ev.slutford ? 'Återställ till ej slutförd' : 'Markera som slutförd'}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => push({ kind: 'kalender.edit', id: ev.id })}
        >
          <Pencil size={16} />
          Redigera
        </button>
        <button type="button" className="btn btn-danger" onClick={remove} disabled={busy}>
          <Trash2 size={16} />
          Radera
        </button>
      </div>
    </div>
  )
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-9 w-9 rounded-lg bg-elevated text-muted flex items-center justify-center shrink-0">{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-[11px] uppercase tracking-widest text-muted">{label}</span>
        <span className="block text-sm text-fg break-words">{value}</span>
      </span>
    </div>
  )
}
