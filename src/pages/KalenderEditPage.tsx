import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNav } from '../lib/navigation'
import type { KalenderEvent, Projekt } from '../lib/types'
import { Loading } from '../components/Loading'
import { toIsoDateInput, toIsoDateTimeInput } from '../lib/format'

const DEFAULT_FARG = '#6366f1'

interface Props {
  id?: string
  defaultProjektId?: string
}

export function KalenderEditPage({ id, defaultProjektId }: Props) {
  const { pop } = useNav()
  const isNew = !id

  const [titel, setTitel] = useState('')
  const [beskrivning, setBeskrivning] = useState('')
  const [plats, setPlats] = useState('')
  const [helDag, setHelDag] = useState(false)
  const [start, setStart] = useState('')
  const [slut, setSlut] = useState('')
  const [farg, setFarg] = useState(DEFAULT_FARG)
  const [projektId, setProjektId] = useState<string | ''>(defaultProjektId ?? '')
  const [deltagareText, setDeltagareText] = useState('')
  const [projektList, setProjektList] = useState<Pick<Projekt, 'id' | 'namn' | 'projekt_nummer'>[]>([])
  const [loaded, setLoaded] = useState(isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const { data: pData } = await supabase
        .from('projekt').select('id, namn, projekt_nummer').order('namn')
      setProjektList((pData ?? []) as Array<Pick<Projekt, 'id' | 'namn' | 'projekt_nummer'>>)

      if (isNew) {
        const now = new Date()
        now.setMinutes(now.getMinutes() - now.getMinutes() % 15, 0, 0)
        const later = new Date(now.getTime() + 60 * 60 * 1000)
        setStart(toIsoDateTimeInput(now))
        setSlut(toIsoDateTimeInput(later))
        return
      }

      const { data, error: e } = await supabase
        .from('kalender_events').select('*').eq('id', id).maybeSingle()
      if (e) { setError(e.message); setLoaded(true); return }
      if (!data) { setError('Händelsen hittades inte.'); setLoaded(true); return }
      const ev = data as KalenderEvent
      setTitel(ev.titel)
      setBeskrivning(ev.beskrivning)
      setPlats(ev.plats)
      setHelDag(ev.hel_dag)
      setStart(ev.hel_dag ? toIsoDateInput(ev.start) : toIsoDateTimeInput(ev.start))
      setSlut(ev.hel_dag ? toIsoDateInput(ev.slut) : toIsoDateTimeInput(ev.slut))
      setFarg(ev.farg || DEFAULT_FARG)
      setProjektId(ev.projekt_id ?? '')
      setDeltagareText((ev.deltagare ?? []).join(', '))
      setLoaded(true)
    })()
  }, [id, isNew])

  async function save() {
    if (!titel.trim()) { setError('Ange en titel.'); return }
    if (!start)        { setError('Ange starttid.'); return }
    if (!slut)         { setError('Ange sluttid.'); return }

    const startIso = helDag ? new Date(start + 'T00:00:00').toISOString() : new Date(start).toISOString()
    const slutIso  = helDag ? new Date(slut + 'T23:59:59').toISOString() : new Date(slut).toISOString()
    if (slutIso < startIso) { setError('Sluttid måste vara efter starttid.'); return }

    const deltagare = deltagareText
      .split(',').map((s) => s.trim()).filter(Boolean)

    setError(null)
    setSaving(true)

    const payload = {
      titel: titel.trim(),
      beskrivning: beskrivning.trim(),
      plats: plats.trim(),
      hel_dag: helDag,
      start: startIso,
      slut: slutIso,
      farg,
      projekt_id: projektId || null,
      deltagare,
    }

    if (isNew) {
      const { error: e } = await supabase.from('kalender_events').insert(payload)
      setSaving(false)
      if (e) { setError(e.message); return }
    } else {
      const { error: e } = await supabase.from('kalender_events').update(payload).eq('id', id)
      setSaving(false)
      if (e) { setError(e.message); return }
    }
    pop()
  }

  if (!loaded) return <Loading />

  return (
    <div className="flex flex-col p-5 gap-4">
      <label className="block">
        <span className="field-label">Titel</span>
        <input className="input" value={titel} onChange={(e) => setTitel(e.target.value)} autoFocus={isNew} />
      </label>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={helDag}
          onChange={(e) => {
            const next = e.target.checked
            setHelDag(next)
            if (next) {
              setStart(toIsoDateInput(start || new Date()))
              setSlut(toIsoDateInput(slut || start || new Date()))
            } else {
              setStart(toIsoDateTimeInput(start || new Date()))
              setSlut(toIsoDateTimeInput(slut || new Date(Date.now() + 3600_000)))
            }
          }}
          className="h-5 w-5"
        />
        Heldag
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="field-label">Start</span>
          <input
            className="input"
            type={helDag ? 'date' : 'datetime-local'}
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="field-label">Slut</span>
          <input
            className="input"
            type={helDag ? 'date' : 'datetime-local'}
            value={slut}
            onChange={(e) => setSlut(e.target.value)}
          />
        </label>
      </div>

      <label className="block">
        <span className="field-label">Plats</span>
        <input className="input" value={plats} onChange={(e) => setPlats(e.target.value)} placeholder="t.ex. arbetsplats eller adress" />
      </label>

      <label className="block">
        <span className="field-label">Projekt (valfritt)</span>
        <select
          className="input"
          value={projektId}
          onChange={(e) => setProjektId(e.target.value)}
        >
          <option value="">— Inget —</option>
          {projektList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.projekt_nummer ? `${p.projekt_nummer} · ` : ''}{p.namn}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="field-label">Deltagare (kommaseparerade)</span>
        <input
          className="input"
          value={deltagareText}
          onChange={(e) => setDeltagareText(e.target.value)}
          placeholder="t.ex. Anders, Lisa, Per"
        />
      </label>

      <label className="block">
        <span className="field-label">Beskrivning</span>
        <textarea className="input min-h-24" rows={4} value={beskrivning} onChange={(e) => setBeskrivning(e.target.value)} />
      </label>

      <label className="block">
        <span className="field-label">Färg</span>
        <input
          type="color"
          value={farg}
          onChange={(e) => setFarg(e.target.value)}
          className="h-10 w-20 rounded-md border border-border bg-surface p-1"
        />
      </label>

      {error && (
        <div className="px-3 py-2 rounded-lg bg-danger-soft text-danger text-xs">{error}</div>
      )}

      <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
        <Save size={16} />
        {saving ? 'Sparar…' : 'Spara'}
      </button>
    </div>
  )
}
