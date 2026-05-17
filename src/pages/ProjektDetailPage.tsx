import { useCallback, useEffect, useMemo, useState } from 'react'
import { Info, Calendar, StickyNote, FileText, FileEdit, Folder } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNav } from '../lib/navigation'
import type { Farg, Kund, Projekt, ProjektStatusar } from '../lib/types'
import { FARG_DOT } from '../lib/types'
import { Loading } from '../components/Loading'
import { SectionCard } from '../components/SectionCard'
import { fmtDate, fmtMoney } from '../lib/format'

interface ProjektFull extends Projekt {
  kund: Pick<Kund, 'id' | 'namn' | 'kundnummer'> | null
}

interface Counts {
  anteckningar: number
  forslag: number
  ata: number
  dokument: number
  firstForslagId: string | null
}

const FARG_BADGE: Record<Farg, string> = {
  emerald: 'badge-success',
  amber:   'badge-warn',
  red:     'badge-danger',
  blue:    'badge-neutral',
  muted:   'badge-neutral',
}

export function ProjektDetailPage({ id }: { id: string }) {
  const { push } = useNav()
  const [projekt, setProjekt] = useState<ProjektFull | null>(null)
  const [statusar, setStatusar] = useState<ProjektStatusar[]>([])
  const [counts, setCounts] = useState<Counts | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setError(null)
    const [proj, ant, frs, atas, dok, stat] = await Promise.all([
      supabase.from('projekt').select('*, kund:kunder(id, namn, kundnummer)').eq('id', id).maybeSingle(),
      supabase.from('projekt_anteckningar').select('id', { count: 'exact', head: true }).eq('projekt_id', id),
      supabase.from('forslag').select('id').eq('projekt_id', id).order('skapad_at', { ascending: false }),
      supabase.from('ata').select('id', { count: 'exact', head: true }).eq('projekt_id', id),
      supabase.from('projekt_dokument').select('id', { count: 'exact', head: true }).eq('projekt_id', id),
      supabase.from('projekt_statusar').select('*').order('sortering'),
    ])
    if (proj.error) { setError(proj.error.message); return }
    if (!proj.data) { setError('Projektet hittades inte.'); return }
    setProjekt(proj.data as unknown as ProjektFull)
    if (!stat.error) setStatusar((stat.data ?? []) as ProjektStatusar[])

    const forslagIds = (frs.data ?? []) as Array<{ id: string }>
    setCounts({
      anteckningar: ant.count ?? 0,
      forslag: forslagIds.length,
      ata: atas.count ?? 0,
      dokument: dok.count ?? 0,
      firstForslagId: forslagIds[0]?.id ?? null,
    })
  }, [id])

  useEffect(() => { void reload() }, [reload])

  const statusFarg = useMemo(() =>
    statusar.find((s) => s.namn === projekt?.status)?.farg ?? null
  , [projekt, statusar])

  if (error) return <div className="px-5 py-6 text-sm text-danger">{error}</div>
  if (!projekt || !counts) return <Loading />

  const badgeClass = statusFarg ? FARG_BADGE[statusFarg] : 'badge-neutral'
  const dotClass = statusFarg ? FARG_DOT[statusFarg] : 'bg-subtle'

  const arbetsplats = [
    projekt.arbetsplats_adress,
    [projekt.arbetsplats_postnummer, projekt.arbetsplats_stad].filter(Boolean).join(' '),
  ].filter(Boolean).join(', ')

  return (
    <div className="flex flex-col">
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <p className="text-[11px] uppercase tracking-widest text-muted">{projekt.projekt_nummer ?? 'Projekt'}</p>
        <h2 className="text-xl font-semibold text-fg mt-1">{projekt.namn}</h2>
        {projekt.kund && (
          <p className="text-xs text-muted mt-1">
            För <span className="text-fg">{projekt.kund.namn}</span>
          </p>
        )}
        <div className="mt-3 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dotClass}`} />
          <span className={`badge ${badgeClass}`}>{projekt.status}</span>
        </div>
      </div>

      <div className="px-5 py-4 border-b border-border grid grid-cols-2 gap-x-6 gap-y-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted mb-0.5">Startdatum</p>
          <p className="text-sm text-fg">{fmtDate(projekt.startdatum) || '—'}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted mb-0.5">Slutdatum</p>
          <p className="text-sm text-fg">{fmtDate(projekt.slutdatum) || '—'}</p>
        </div>
        {projekt.budget_total != null && (
          <div className="col-span-2">
            <p className="text-[11px] uppercase tracking-widest text-muted mb-0.5">Budget</p>
            <p className="text-sm text-fg">{fmtMoney(projekt.budget_total)}</p>
          </div>
        )}
        {arbetsplats && (
          <div className="col-span-2">
            <p className="text-[11px] uppercase tracking-widest text-muted mb-0.5">Arbetsplats</p>
            <p className="text-sm text-fg">{arbetsplats}</p>
          </div>
        )}
      </div>

      <section className="p-3 grid grid-cols-2 gap-3">
        <SectionCard
          icon={<Info size={20} />}
          label="Info"
          onClick={() => push({ kind: 'projekt.info', projektId: projekt.id })}
        />
        <SectionCard
          icon={<StickyNote size={20} />}
          label="Anteckningar"
          count={counts.anteckningar}
          onClick={() => push({ kind: 'projekt.anteckningar', projektId: projekt.id })}
        />
        <SectionCard
          icon={<FileText size={20} />}
          label="Förslag"
          count={counts.forslag}
          onClick={() => push({ kind: 'projekt.forslag', projektId: projekt.id })}
        />
        <SectionCard
          icon={<FileEdit size={20} />}
          label="ÄTA"
          count={counts.ata}
          onClick={() => push({ kind: 'projekt.ata', projektId: projekt.id })}
        />
        <SectionCard
          icon={<Folder size={20} />}
          label="Dokument"
          count={counts.dokument}
          onClick={() => push({ kind: 'projekt.dokument', projektId: projekt.id })}
        />
        <SectionCard
          icon={<Calendar size={20} />}
          label="Tidplan"
          onClick={() => counts.firstForslagId && push({
            kind: 'tidplan.detail',
            projektId: projekt.id,
            forslagId: counts.firstForslagId,
          })}
          disabled={!counts.firstForslagId}
        />
      </section>
    </div>
  )
}
