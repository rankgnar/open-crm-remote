import { useEffect, useState } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNav } from '../lib/navigation'
import type { Projekt, Kund } from '../lib/types'
import { Loading } from '../components/Loading'
import { fmtMoney, fmtNumber } from '../lib/format'

interface DraftRad {
  beskrivning: string
  antal: number
  enhet: string
  a_pris: number
}

const MOMS_PROCENT = 25
const EMPTY_RAD: DraftRad = { beskrivning: '', antal: 1, enhet: 'st', a_pris: 0 }

interface ProjektForCreate extends Projekt {
  kund: Pick<Kund, 'id' | 'namn' | 'org_nummer'> | null
}

export function AtaCreatePage({ projektId }: { projektId?: string }) {
  const { pop, push } = useNav()
  const [projekt, setProjekt] = useState<ProjektForCreate | null | 'missing'>(null)
  const [titel, setTitel] = useState('')
  const [beskrivning, setBeskrivning] = useState('')
  const [rader, setRader] = useState<DraftRad[]>([{ ...EMPTY_RAD }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projektId) { setProjekt('missing'); return }
    void (async () => {
      const { data, error: e } = await supabase
        .from('projekt')
        .select('*, kund:kunder(id, namn, org_nummer)')
        .eq('id', projektId)
        .maybeSingle()
      if (e) { setError(e.message); return }
      if (!data) { setProjekt('missing'); return }
      setProjekt(data as unknown as ProjektForCreate)
    })()
  }, [projektId])

  if (projekt === null) return <Loading />

  if (projekt === 'missing') {
    return (
      <div className="p-6 space-y-3 text-sm">
        <p className="text-fg">Välj först ett projekt att skapa ÄTA för.</p>
        <button className="btn btn-ghost" onClick={pop}>Tillbaka</button>
      </div>
    )
  }

  const belopp_netto = rader.reduce((s, r) => s + Number(r.antal || 0) * Number(r.a_pris || 0), 0)
  const belopp_moms  = belopp_netto * (MOMS_PROCENT / 100)
  const belopp_total = belopp_netto + belopp_moms

  function updateRad(idx: number, patch: Partial<DraftRad>) {
    setRader((rs) => rs.map((r, i) => i === idx ? { ...r, ...patch } : r))
  }

  function addRad() { setRader((rs) => [...rs, { ...EMPTY_RAD }]) }
  function removeRad(idx: number) { setRader((rs) => rs.length > 1 ? rs.filter((_, i) => i !== idx) : rs) }

  async function save() {
    if (!projekt || projekt === 'missing') return
    if (!projekt.kund) { setError('Projektet saknar kund.'); return }
    if (!titel.trim()) { setError('Ange en titel.'); return }
    if (rader.every((r) => !r.beskrivning.trim())) { setError('Minst en rad krävs.'); return }

    setError(null)
    setSaving(true)

    try {
      const { data: nrData, error: nrErr } = await supabase.rpc('nextval_ata_nummer')
      if (nrErr) throw nrErr
      const ata_nummer = `A-${String(nrData as number).padStart(4, '0')}`

      const { data: ata, error: insErr } = await supabase
        .from('ata')
        .insert({
          ata_nummer,
          projekt_id: projekt.id,
          kund_id: projekt.kund.id,
          kund_namn: projekt.kund.namn,
          kund_org_nr: projekt.kund.org_nummer ?? '',
          titel: titel.trim(),
          beskrivning: beskrivning.trim(),
          status: 'Utkast',
          belopp_netto,
          belopp_moms,
          belopp_total,
        })
        .select('id')
        .single()
      if (insErr) throw insErr

      const cleanRader = rader.filter((r) => r.beskrivning.trim())
      if (cleanRader.length > 0) {
        const { error: radErr } = await supabase.from('ata_rader').insert(
          cleanRader.map((r, i) => ({
            ata_id: ata.id,
            beskrivning: r.beskrivning.trim(),
            antal: Number(r.antal),
            enhet: r.enhet || 'st',
            a_pris: Number(r.a_pris),
            belopp: Number(r.antal) * Number(r.a_pris),
            sortering: i,
          })),
        )
        if (radErr) throw radErr
      }

      push({ kind: 'ata.detail', id: ata.id })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col p-5 gap-4">
      <div className="card p-4">
        <p className="text-[11px] uppercase tracking-widest text-muted">Projekt</p>
        <p className="text-sm font-medium text-fg mt-1">{projekt.namn}</p>
        {projekt.kund && <p className="text-xs text-muted mt-0.5">{projekt.kund.namn}</p>}
      </div>

      <label className="block">
        <span className="field-label">Titel</span>
        <input className="input" value={titel} onChange={(e) => setTitel(e.target.value)} placeholder="Vad gäller ÄTA:n?" />
      </label>

      <label className="block">
        <span className="field-label">Beskrivning (valfritt)</span>
        <textarea className="input min-h-24" rows={4} value={beskrivning} onChange={(e) => setBeskrivning(e.target.value)} />
      </label>

      <section>
        <div className="flex items-center justify-between mb-2">
          <span className="field-label !mb-0">Rader</span>
        </div>

        <ul className="space-y-3">
          {rader.map((r, idx) => (
            <li key={idx} className="card p-3 space-y-2">
              <input
                className="input"
                value={r.beskrivning}
                onChange={(e) => updateRad(idx, { beskrivning: e.target.value })}
                placeholder="Beskrivning"
              />
              <div className="grid grid-cols-12 gap-2">
                <input
                  className="input col-span-3 text-right"
                  type="number" inputMode="decimal" step="0.01" min="0"
                  value={r.antal}
                  onChange={(e) => updateRad(idx, { antal: Number(e.target.value) })}
                />
                <input
                  className="input col-span-3 text-center"
                  value={r.enhet}
                  onChange={(e) => updateRad(idx, { enhet: e.target.value })}
                  placeholder="st"
                />
                <input
                  className="input col-span-6 text-right"
                  type="number" inputMode="decimal" step="0.01" min="0"
                  value={r.a_pris}
                  onChange={(e) => updateRad(idx, { a_pris: Number(e.target.value) })}
                  placeholder="à pris"
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => removeRad(idx)}
                  disabled={rader.length === 1}
                  className="text-danger disabled:opacity-40 inline-flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  Ta bort
                </button>
                <span className="text-fg">
                  {fmtNumber(r.antal)} × {fmtMoney(r.a_pris)} = <span className="font-medium">{fmtMoney(Number(r.antal) * Number(r.a_pris))}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>

        <button type="button" onClick={addRad} className="btn btn-ghost w-full mt-3">
          <Plus size={16} />
          Lägg till rad
        </button>
      </section>

      <section className="card p-4 space-y-1.5 text-sm">
        <Row label="Netto" value={fmtMoney(belopp_netto)} />
        <Row label={`Moms (${MOMS_PROCENT}%)`} value={fmtMoney(belopp_moms)} />
        <Row label="Totalt" value={fmtMoney(belopp_total)} bold />
      </section>

      {error && (
        <div className="px-3 py-2 rounded-lg bg-danger-soft text-danger text-xs">{error}</div>
      )}

      <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
        <Save size={16} />
        {saving ? 'Sparar…' : 'Spara ÄTA'}
      </button>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? 'font-medium text-fg' : 'text-muted'}`}>
      <span>{label}</span>
      <span className="text-fg">{value}</span>
    </div>
  )
}
