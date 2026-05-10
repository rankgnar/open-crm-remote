import { useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNav } from '../lib/navigation'
import type { Projekt, Kund, Forslag } from '../lib/types'
import { Loading } from '../components/Loading'
import { fmtDate, fmtDateTime, fmtMoney } from '../lib/format'

interface ProjektFull extends Projekt {
  kund: Pick<Kund, 'id' | 'namn' | 'kundnummer'> | null
}

export function ProjektInfoPage({ projektId }: { projektId: string }) {
  const { push } = useNav()
  const [projekt, setProjekt] = useState<ProjektFull | null>(null)
  const [forslag, setForslag] = useState<Forslag[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      setError(null)
      const [pRes, fRes] = await Promise.all([
        supabase.from('projekt').select('*, kund:kunder(id, namn, kundnummer)').eq('id', projektId).maybeSingle(),
        supabase.from('forslag').select('*').eq('projekt_id', projektId).order('skapad_at', { ascending: false }),
      ])
      if (pRes.error) { setError(pRes.error.message); return }
      if (!pRes.data) { setError('Projektet hittades inte.'); return }
      if (fRes.error) { setError(fRes.error.message); return }
      setProjekt(pRes.data as unknown as ProjektFull)
      setForslag((fRes.data ?? []) as Forslag[])
    })()
  }, [projektId])

  if (error) return <div className="px-5 py-6 text-sm text-danger">{error}</div>
  if (!projekt || !forslag) return <Loading />

  const arbetsplats = [
    projekt.arbetsplats_adress,
    [projekt.arbetsplats_postnummer, projekt.arbetsplats_stad].filter(Boolean).join(' '),
  ].filter(Boolean).join(', ')

  const rotText = projekt.rot_avdrag
    ? `Ja — ${projekt.rot_procent}%${projekt.rot_inkludera_medsokande ? ' (inkl. medsökande)' : ''}`
    : 'Nej'

  return (
    <div className="flex flex-col">
      {projekt.kund && (
        <section className="border-b border-border">
          <p className="px-5 pt-5 text-[11px] uppercase tracking-widest text-muted">Kund</p>
          <button
            type="button"
            onClick={() => projekt.kund && push({ kind: 'kund.detail', id: projekt.kund.id })}
            className="w-full flex items-center gap-3 px-5 py-3 active:bg-hover transition-colors text-left"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-muted">{projekt.kund.kundnummer ?? '—'}</p>
              <p className="text-sm text-fg font-medium truncate mt-0.5">{projekt.kund.namn}</p>
            </div>
            <ChevronRight size={16} className="text-subtle shrink-0" />
          </button>
        </section>
      )}

      <Section title="Projektinfo">
        <Field label="Status" value={<span className="badge badge-neutral">{projekt.status}</span>} />
        <Field label="Preliminär budget" value={fmtMoney(projekt.budget_total)} />
        <Field label="Startdatum" value={fmtDate(projekt.startdatum)} />
        <Field label="Slutdatum" value={fmtDate(projekt.slutdatum)} />
        <Field label="Betalningsvillkor" value={projekt.betalningsvillkor || '—'} />
        <Field label="ROT-avdrag" value={rotText} />
      </Section>

      {arbetsplats && (
        <Section title="Arbetsplats">
          <p className="text-sm text-fg whitespace-pre-wrap">{arbetsplats}</p>
        </Section>
      )}

      {projekt.beskrivning && (
        <Section title="Beskrivning">
          <p className="text-sm text-fg whitespace-pre-wrap">{projekt.beskrivning}</p>
        </Section>
      )}

      {projekt.villkor && (
        <Section title="Villkor">
          <p className="text-sm text-fg whitespace-pre-wrap">{projekt.villkor}</p>
        </Section>
      )}

      {forslag.length > 0 && (
        <Section title="Förslag">
          <ul className="-mx-5">
            {forslag.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => push({ kind: 'forslag.detail', projektId, forslagId: f.id })}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left active:bg-hover transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-fg truncate">
                      {f.forslag_nummer ? `${f.forslag_nummer} — ` : ''}
                      {f.titel || '(utan titel)'}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      <span className="badge badge-neutral mr-2">{f.status}</span>
                      {fmtDate(f.skapad_at)}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-subtle shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <section className="px-5 py-4 border-t border-border flex items-center gap-6 text-[11px] text-subtle">
        <span>Skapad: {fmtDateTime(projekt.skapad_at)}</span>
        <span>Uppdaterad: {fmtDateTime(projekt.uppdaterad_at)}</span>
      </section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-5 py-4 border-t border-border first:border-t-0 first:pt-5">
      <p className="text-[11px] uppercase tracking-widest text-muted mb-3">{title}</p>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function Field({
  label,
  value,
  onClick,
}: {
  label: string
  value: React.ReactNode
  onClick?: () => void
}) {
  const inner = (
    <>
      <span className="text-[11px] uppercase tracking-widest text-muted">{label}</span>
      <span className="text-sm text-fg flex items-center gap-2">{value}</span>
    </>
  )
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full flex flex-col items-start text-left active:bg-hover -mx-5 px-5 py-1 transition-colors"
      >
        {inner}
      </button>
    )
  }
  return <div className="flex flex-col">{inner}</div>
}
