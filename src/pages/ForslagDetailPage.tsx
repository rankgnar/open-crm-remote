import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight as ChevR } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type {
  Forslag, ForslagFas, ForslagSubfas, ForslagArbete, ForslagMaterial, ForslagUe,
} from '../lib/types'
import { Loading } from '../components/Loading'
import { fmtDate, fmtMoney, fmtNumber } from '../lib/format'

interface Props {
  forslagId: string
}

interface Bundle {
  forslag: Forslag
  faser: ForslagFas[]
  subfaser: ForslagSubfas[]
  arbete: ForslagArbete[]
  material: ForslagMaterial[]
  ue: ForslagUe[]
}

export function ForslagDetailPage({ forslagId }: Props) {
  const [bundle, setBundle] = useState<Bundle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [openFas, setOpenFas] = useState<Set<string>>(new Set())

  useEffect(() => {
    void (async () => {
      setError(null)
      const { data: forslag, error: fErr } = await supabase
        .from('forslag').select('*').eq('id', forslagId).maybeSingle()
      if (fErr) { setError(fErr.message); return }
      if (!forslag) { setError('Förslaget hittades inte.'); return }

      const { data: faser, error: fasErr } = await supabase
        .from('forslag_faser').select('*').eq('forslag_id', forslagId).order('sortering')
      if (fasErr) { setError(fasErr.message); return }

      const fasIds = (faser ?? []).map((f: ForslagFas) => f.id)
      if (fasIds.length === 0) {
        setBundle({ forslag: forslag as Forslag, faser: [], subfaser: [], arbete: [], material: [], ue: [] })
        return
      }

      const { data: subfaser, error: sfErr } = await supabase
        .from('forslag_subfaser').select('*').in('fas_id', fasIds).order('sortering')
      if (sfErr) { setError(sfErr.message); return }

      const subfasIds = (subfaser ?? []).map((s: ForslagSubfas) => s.id)
      const [arbeteRes, materialRes, ueRes] = subfasIds.length > 0
        ? await Promise.all([
            supabase.from('forslag_arbetskostnad').select('*').in('subfas_id', subfasIds),
            supabase.from('forslag_materialkostnad').select('*').in('subfas_id', subfasIds),
            supabase.from('forslag_underentreprenorer').select('*').in('subfas_id', subfasIds),
          ])
        : [{ data: [], error: null }, { data: [], error: null }, { data: [], error: null }]

      if (arbeteRes.error) { setError(arbeteRes.error.message); return }
      if (materialRes.error) { setError(materialRes.error.message); return }
      if (ueRes.error) { setError(ueRes.error.message); return }

      setBundle({
        forslag: forslag as Forslag,
        faser: (faser ?? []) as ForslagFas[],
        subfaser: (subfaser ?? []) as ForslagSubfas[],
        arbete: (arbeteRes.data ?? []) as ForslagArbete[],
        material: (materialRes.data ?? []) as ForslagMaterial[],
        ue: (ueRes.data ?? []) as ForslagUe[],
      })
      setOpenFas(new Set((faser ?? []).map((f: ForslagFas) => f.id)))
    })()
  }, [forslagId])

  function toggleFas(id: string) {
    setOpenFas((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (error) return <div className="px-5 py-6 text-sm text-danger">{error}</div>
  if (!bundle) return <Loading />

  const { forslag, faser, subfaser, arbete, material, ue } = bundle

  const arbeteTotal   = arbete.reduce((s, a) => s + Number(a.antal_timmar) * Number(a.timpris), 0)
  const materialTotal = material.reduce((s, m) => s + Number(m.antal) * Number(m.a_pris), 0)
  const ueTotal       = ue.reduce((s, u) => s + Number(u.kostnad), 0)
  const total         = arbeteTotal + materialTotal + ueTotal
  const momsBelopp    = total * (Number(forslag.moms_procent) / 100)
  const totalInkl     = total + momsBelopp

  return (
    <div className="flex flex-col">
      <div className="px-5 pt-5 pb-3 border-b border-border">
        <p className="text-[11px] uppercase tracking-widest text-muted">{forslag.forslag_nummer ?? 'Förslag'}</p>
        <h2 className="text-xl font-semibold text-fg mt-1">{forslag.titel}</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="badge badge-neutral">{forslag.status}</span>
          {forslag.giltig_till && <span className="text-muted">Giltigt t.o.m. {fmtDate(forslag.giltig_till)}</span>}
        </div>
      </div>

      <section className="px-5 py-4 border-b border-border space-y-2">
        <Row label="Arbete"   value={fmtMoney(arbeteTotal)} />
        <Row label="Material" value={fmtMoney(materialTotal)} />
        {ueTotal > 0 && <Row label="Underentreprenörer" value={fmtMoney(ueTotal)} />}
        <Row label="Summa exkl. moms" value={fmtMoney(total)} bold />
        <Row label={`Moms (${fmtNumber(forslag.moms_procent)}%)`} value={fmtMoney(momsBelopp)} />
        <Row label="Summa inkl. moms" value={fmtMoney(totalInkl)} bold />
      </section>

      {forslag.sammanfattning && (
        <section className="px-5 py-4 border-b border-border">
          <p className="text-[11px] uppercase tracking-widest text-muted mb-2">Sammanfattning</p>
          <p className="text-sm text-fg whitespace-pre-wrap">{forslag.sammanfattning}</p>
        </section>
      )}

      <section>
        <header className="px-5 pt-5 pb-2">
          <h3 className="text-[11px] uppercase tracking-widest text-muted">Faser ({faser.length})</h3>
        </header>

        {faser.length === 0 ? (
          <p className="px-5 pb-6 text-sm text-subtle">Inga faser registrerade.</p>
        ) : (
          <ul>
            {faser.map((f) => {
              const fasSubs = subfaser.filter((s) => s.fas_id === f.id)
              const subIds = fasSubs.map((s) => s.id)
              const fasArbete   = arbete.filter((a) => subIds.includes(a.subfas_id))
              const fasMaterial = material.filter((m) => subIds.includes(m.subfas_id))
              const fasUe       = ue.filter((u) => subIds.includes(u.subfas_id))
              const fasTotal =
                fasArbete.reduce((s, a) => s + Number(a.antal_timmar) * Number(a.timpris), 0) +
                fasMaterial.reduce((s, m) => s + Number(m.antal) * Number(m.a_pris), 0) +
                fasUe.reduce((s, u) => s + Number(u.kostnad), 0)
              const isOpen = openFas.has(f.id)
              return (
                <li key={f.id} className="border-b border-border">
                  <button
                    type="button"
                    onClick={() => toggleFas(f.id)}
                    className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-hover"
                  >
                    {isOpen ? <ChevronDown size={16} className="text-subtle" /> : <ChevR size={16} className="text-subtle" />}
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-fg truncate">{f.namn || '(utan namn)'}</span>
                      <span className="block text-xs text-muted">
                        {[fmtDate(f.start_datum), fmtDate(f.slut_datum)].filter((v) => v !== '—').join(' – ') || ' '}
                      </span>
                    </span>
                    <span className="text-sm font-medium text-fg">{fmtMoney(fasTotal)}</span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-3 space-y-3">
                      {fasSubs.length === 0 && <p className="text-xs text-subtle">Inga subfaser.</p>}
                      {fasSubs.map((sf) => {
                        const sfArbete   = fasArbete.filter((a) => a.subfas_id === sf.id)
                        const sfMaterial = fasMaterial.filter((m) => m.subfas_id === sf.id)
                        const sfUe       = fasUe.filter((u) => u.subfas_id === sf.id)
                        return (
                          <div key={sf.id} className="rounded-lg border border-border overflow-hidden">
                            <div className="px-3 py-2 bg-elevated text-xs font-medium text-fg">
                              {sf.namn || '(utan namn)'}
                            </div>
                            <div className="text-xs">
                              {sfArbete.map((a) => (
                                <SubLine key={a.id} label={a.beskrivning} meta={`${fmtNumber(a.antal_timmar)}h × ${fmtMoney(a.timpris)}`} value={fmtMoney(Number(a.antal_timmar) * Number(a.timpris))} />
                              ))}
                              {sfMaterial.map((m) => (
                                <SubLine key={m.id} label={m.beskrivning} meta={`${fmtNumber(m.antal)} ${m.enhet ?? ''} × ${fmtMoney(m.a_pris)}`} value={fmtMoney(Number(m.antal) * Number(m.a_pris))} />
                              ))}
                              {sfUe.map((u) => (
                                <SubLine key={u.id} label={u.namn} meta="UE" value={fmtMoney(u.kostnad)} />
                              ))}
                              {sfArbete.length + sfMaterial.length + sfUe.length === 0 && (
                                <p className="px-3 py-2 text-subtle">Tom subfas.</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? 'text-fg font-medium' : 'text-muted'} text-sm`}>
      <span>{label}</span>
      <span className={bold ? 'text-fg' : 'text-fg'}>{value}</span>
    </div>
  )
}

function SubLine({ label, meta, value }: { label: string; meta?: string; value: string }) {
  return (
    <div className="px-3 py-1.5 flex items-center gap-2 border-t border-border">
      <span className="flex-1 min-w-0">
        <span className="block text-fg truncate">{label || '—'}</span>
        {meta && <span className="block text-subtle">{meta}</span>}
      </span>
      <span className="text-fg shrink-0">{value}</span>
    </div>
  )
}
