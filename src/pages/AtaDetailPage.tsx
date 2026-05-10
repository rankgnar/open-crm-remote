import { useEffect, useState } from 'react'
import { Plus, PenSquare } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNav } from '../lib/navigation'
import type { Ata, AtaRad, Projekt } from '../lib/types'
import { Loading } from '../components/Loading'
import { SignaturePanel } from '../components/SignaturePanel'
import { fmtMoney, fmtNumber, fmtDateTime } from '../lib/format'

interface AtaWithProjekt extends Ata {
  projekt: Pick<Projekt, 'id' | 'namn' | 'projekt_nummer'> | null
}

export function AtaDetailPage({ id }: { id: string }) {
  const { push } = useNav()
  const [ata, setAta] = useState<AtaWithProjekt | null>(null)
  const [rader, setRader] = useState<AtaRad[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      setError(null)
      const [aRes, rRes] = await Promise.all([
        supabase.from('ata').select('*, projekt:projekt_id(id, namn, projekt_nummer)').eq('id', id).maybeSingle(),
        supabase.from('ata_rader').select('*').eq('ata_id', id).order('sortering'),
      ])
      if (aRes.error) { setError(aRes.error.message); return }
      if (!aRes.data) { setError('ÄTA hittades inte.'); return }
      if (rRes.error) { setError(rRes.error.message); return }
      setAta(aRes.data as unknown as AtaWithProjekt)
      setRader((rRes.data ?? []) as AtaRad[])
    })()
  }, [id])

  if (error) return <div className="px-5 py-6 text-sm text-danger">{error}</div>
  if (!ata || !rader) return <Loading />

  return (
    <div className="flex flex-col">
      <div className="px-5 pt-5 pb-3 border-b border-border">
        <p className="text-[11px] uppercase tracking-widest text-muted">{ata.ata_nummer}</p>
        <h2 className="text-xl font-semibold text-fg mt-1">{ata.titel}</h2>
        <div className="mt-2 text-xs text-muted">
          {ata.projekt && (
            <button
              type="button"
              onClick={() => ata.projekt && push({ kind: 'projekt.detail', id: ata.projekt.id })}
              className="underline-offset-2 hover:underline"
            >
              {ata.projekt.namn}
            </button>
          )}
          {ata.kund_namn && <span> · {ata.kund_namn}</span>}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="badge badge-neutral">{ata.status}</span>
          {ata.godkand_datum && <span className="text-muted">Godkänt {fmtDateTime(ata.godkand_datum)}</span>}
        </div>
      </div>

      {ata.beskrivning && (
        <section className="px-5 py-4 border-b border-border">
          <p className="text-[11px] uppercase tracking-widest text-muted mb-2">Beskrivning</p>
          <p className="text-sm text-fg whitespace-pre-wrap">{ata.beskrivning}</p>
        </section>
      )}

      <section>
        <header className="px-5 pt-5 pb-2 flex items-center justify-between">
          <h3 className="text-[11px] uppercase tracking-widest text-muted">Rader ({rader.length})</h3>
        </header>

        {rader.length === 0 ? (
          <p className="px-5 pb-4 text-sm text-subtle">Inga rader.</p>
        ) : (
          <ul>
            {rader.map((r) => (
              <li key={r.id} className="px-5 py-3 border-b border-border">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-fg flex-1 min-w-0 truncate">{r.beskrivning || '—'}</p>
                  <p className="text-sm text-fg shrink-0">{fmtMoney(r.belopp)}</p>
                </div>
                <p className="text-xs text-muted mt-1">
                  {fmtNumber(r.antal)} {r.enhet} × {fmtMoney(r.a_pris)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="px-5 py-4 border-t border-border space-y-1.5 mt-2">
        <Row label="Netto" value={fmtMoney(ata.belopp_netto)} />
        <Row label="Moms"  value={fmtMoney(ata.belopp_moms)} />
        <Row label="Totalt" value={fmtMoney(ata.belopp_total)} bold />
      </section>

      <SignaturePanel
        status={ata.status}
        acceptedStatuses={['Godkänd']}
        godkand_av={ata.godkand_av}
        godkand_datum={ata.godkand_datum}
        signatur_data={ata.signatur_data}
      />

      {ata.status !== 'Godkänd' && (
        <div className="px-5 pt-4">
          <button
            type="button"
            onClick={() => push({ kind: 'ata.sign', id: ata.id })}
            className="btn btn-primary w-full"
          >
            <PenSquare size={16} />
            Signera nu
          </button>
        </div>
      )}

      {ata.status === 'Utkast' && ata.projekt && (
        <div className="px-5 pt-3 pb-6">
          <button
            type="button"
            onClick={() => ata.projekt && push({ kind: 'ata.create', projektId: ata.projekt.id })}
            className="btn btn-ghost w-full"
          >
            <Plus size={16} />
            Ny ÄTA för samma projekt
          </button>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between text-sm ${bold ? 'font-medium' : 'text-muted'}`}>
      <span>{label}</span>
      <span className="text-fg">{value}</span>
    </div>
  )
}
