import { useCallback, useEffect, useState } from 'react'
import { Info, Calendar, StickyNote, FileText, FileEdit, Folder } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNav } from '../lib/navigation'
import type { Projekt, Kund } from '../lib/types'
import { Loading } from '../components/Loading'
import { SectionCard } from '../components/SectionCard'

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

export function ProjektDetailPage({ id }: { id: string }) {
  const { push } = useNav()
  const [projekt, setProjekt] = useState<ProjektFull | null>(null)
  const [counts, setCounts] = useState<Counts | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setError(null)
    const [proj, ant, frs, atas, dok] = await Promise.all([
      supabase.from('projekt').select('*, kund:kunder(id, namn, kundnummer)').eq('id', id).maybeSingle(),
      supabase.from('projekt_anteckningar').select('id', { count: 'exact', head: true }).eq('projekt_id', id),
      supabase.from('forslag').select('id').eq('projekt_id', id).order('skapad_at', { ascending: false }),
      supabase.from('ata').select('id', { count: 'exact', head: true }).eq('projekt_id', id),
      supabase.from('projekt_dokument').select('id', { count: 'exact', head: true }).eq('projekt_id', id),
    ])
    if (proj.error) { setError(proj.error.message); return }
    if (!proj.data) { setError('Projektet hittades inte.'); return }
    setProjekt(proj.data as unknown as ProjektFull)

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

  if (error) return <div className="px-5 py-6 text-sm text-danger">{error}</div>
  if (!projekt || !counts) return <Loading />

  return (
    <div className="flex flex-col">
      <div className="px-5 pt-5 pb-3 border-b border-border">
        <p className="text-[11px] uppercase tracking-widest text-muted">{projekt.projekt_nummer ?? 'Projekt'}</p>
        <h2 className="text-xl font-semibold text-fg mt-1">{projekt.namn}</h2>
        {projekt.kund && (
          <p className="text-xs text-muted mt-1">
            För <span className="text-fg">{projekt.kund.namn}</span>
          </p>
        )}
        <div className="mt-3 flex items-center gap-2">
          <span className="badge badge-neutral">{projekt.status}</span>
        </div>
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
