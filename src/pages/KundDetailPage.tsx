import { useEffect, useState } from 'react'
import { Mail, Phone, MapPin, Briefcase } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNav } from '../lib/navigation'
import type { Kund, Projekt } from '../lib/types'
import { Loading } from '../components/Loading'
import { ListRow } from '../components/ListRow'
import { fmtDate } from '../lib/format'

export function KundDetailPage({ id }: { id: string }) {
  const { push } = useNav()
  const [kund, setKund] = useState<Kund | null>(null)
  const [projekt, setProjekt] = useState<Projekt[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { void load() }, [id])

  async function load() {
    setError(null)
    const [{ data: kData, error: kErr }, { data: pData, error: pErr }] = await Promise.all([
      supabase.from('kunder').select('*').eq('id', id).maybeSingle(),
      supabase.from('projekt').select('*').eq('kund_id', id).order('skapad_at', { ascending: false }),
    ])
    if (kErr) setError(kErr.message)
    else if (!kData) setError('Kunden hittades inte.')
    else setKund(kData as Kund)

    if (pErr) setError(pErr.message)
    else setProjekt((pData ?? []) as Projekt[])
  }

  if (error) return <div className="px-5 py-6 text-sm text-danger">{error}</div>
  if (!kund || !projekt) return <Loading />

  const adress = [kund.adress, [kund.postnummer, kund.stad].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ')
  const mapsHref = adress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adress)}`
    : undefined

  return (
    <div className="flex flex-col">
      <div className="px-5 pt-5 pb-3 border-b border-border">
        <p className="text-[11px] uppercase tracking-widest text-muted">{kund.kundnummer ?? 'Kund'}</p>
        <h2 className="text-xl font-semibold text-fg mt-1">{kund.namn}</h2>
        {kund.org_nummer && (
          <p className="text-xs text-muted mt-1 font-mono">{kund.org_nummer}</p>
        )}
      </div>

      <section className="px-5 py-4 border-b border-border space-y-3">
        {kund.email && <Contact icon={<Mail size={16} />} label="E-post" value={kund.email} href={`mailto:${kund.email}`} />}
        {kund.telefon && <Contact icon={<Phone size={16} />} label="Telefon" value={kund.telefon} href={telHref(kund.telefon)} />}
        {kund.telefon_2 && <Contact icon={<Phone size={16} />} label="Telefon 2" value={kund.telefon_2} href={telHref(kund.telefon_2)} />}
        {adress && <Contact icon={<MapPin size={16} />} label="Adress" value={adress} href={mapsHref} />}
        {!kund.email && !kund.telefon && !adress && (
          <p className="text-xs text-subtle">Inga kontaktuppgifter registrerade.</p>
        )}
      </section>

      <section>
        <header className="px-5 pt-5 pb-2 flex items-center justify-between">
          <h3 className="text-[11px] uppercase tracking-widest text-muted">Projekt ({projekt.length})</h3>
        </header>

        {projekt.length === 0 ? (
          <p className="px-5 pb-6 text-sm text-subtle">Inga projekt knutna till kunden.</p>
        ) : (
          <ul>
            {projekt.map((p) => (
              <li key={p.id}>
                <ListRow
                  leading={
                    <span className="h-9 w-9 rounded-lg bg-elevated text-muted flex items-center justify-center">
                      <Briefcase size={16} />
                    </span>
                  }
                  title={p.namn}
                  subtitle={
                    <span className="flex items-center gap-2">
                      <span className="badge badge-neutral">{p.status}</span>
                      <span>{fmtDate(p.startdatum)} – {fmtDate(p.slutdatum)}</span>
                    </span>
                  }
                  meta={p.projekt_nummer ?? undefined}
                  onClick={() => push({ kind: 'projekt.detail', id: p.id })}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function telHref(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '')
  return `tel:${digits}`
}

function Contact({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const inner = (
    <>
      <span className="h-9 w-9 rounded-lg bg-elevated text-muted flex items-center justify-center shrink-0">
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[11px] uppercase tracking-widest text-muted">{label}</span>
        <span className="block text-sm text-fg truncate">{value}</span>
      </span>
    </>
  )
  const external = href?.startsWith('http')
  return href ? (
    <a
      href={href}
      className="flex items-center gap-3"
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {inner}
    </a>
  ) : (
    <div className="flex items-center gap-3">{inner}</div>
  )
}

