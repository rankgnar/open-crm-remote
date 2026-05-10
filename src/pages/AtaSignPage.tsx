import { useEffect, useRef, useState } from 'react'
import { Eraser } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNav } from '../lib/navigation'
import type { Ata } from '../lib/types'
import { Loading } from '../components/Loading'
import { SignaturePad, type SignaturePadHandle } from '../components/SignaturePad'

export function AtaSignPage({ id }: { id: string }) {
  const { pop } = useNav()
  const padRef = useRef<SignaturePadHandle>(null)
  const [ata, setAta] = useState<Ata | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [namn, setNamn] = useState('')
  const [hasInk, setHasInk] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase
        .from('ata')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (error) { setLoadError(error.message); return }
      if (!data) { setLoadError('ÄTA hittades inte.'); return }
      setAta(data as Ata)
    })()
  }, [id])

  async function handleSubmit() {
    if (!ata) return
    if (!namn.trim()) { setSubmitError('Ange namn'); return }
    if (!hasInk) { setSubmitError('Signera först'); return }
    const dataUrl = padRef.current?.toDataURL()
    if (!dataUrl) { setSubmitError('Kunde inte läsa signaturen'); return }

    setSubmitError(null)
    setSubmitting(true)
    const { error } = await supabase
      .from('ata')
      .update({
        status: 'Godkänd',
        godkand_av: namn.trim(),
        godkand_datum: new Date().toISOString(),
        signatur_data: dataUrl,
      })
      .eq('id', ata.id)
    if (error) {
      setSubmitError(error.message)
      setSubmitting(false)
      return
    }
    pop()
  }

  if (loadError) return <div className="px-5 py-6 text-sm text-danger">{loadError}</div>
  if (!ata) return <Loading />

  if (ata.status === 'Godkänd') {
    return (
      <div className="px-5 py-6 text-sm text-muted">
        ÄTA {ata.ata_nummer} är redan godkänd.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-4 pb-3 border-b border-border">
        <p className="text-[11px] uppercase tracking-widest text-muted">{ata.ata_nummer}</p>
        <h2 className="text-base font-semibold text-fg mt-0.5 truncate">{ata.titel}</h2>
      </div>

      <div className="px-5 pt-4 flex flex-col gap-1.5">
        <label className="text-[11px] uppercase tracking-widest text-muted">Godkännarens namn</label>
        <input
          type="text"
          className="input"
          value={namn}
          onChange={(e) => setNamn(e.target.value)}
          placeholder="För- och efternamn"
          autoFocus
        />
      </div>

      <div className="px-5 pt-4 pb-3 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] uppercase tracking-widest text-muted">Signatur</label>
          <button
            type="button"
            onClick={() => padRef.current?.clear()}
            disabled={!hasInk}
            className="flex items-center gap-1 text-[11px] text-muted hover:text-fg transition-colors disabled:opacity-30"
          >
            <Eraser size={12} />
            Rensa
          </button>
        </div>
        <SignaturePad
          ref={padRef}
          onInkChange={setHasInk}
          className="w-full flex-1 min-h-[200px] border border-border"
        />
        <p className="text-[11px] text-subtle mt-2">Skriv med fingret eller pekpennan.</p>
      </div>

      {submitError && (
        <div className="px-5 pb-2 text-xs text-red-400">{submitError}</div>
      )}

      <div className="safe-bottom px-5 py-3 border-t border-border bg-bg flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={pop}
          className="btn btn-ghost flex-1"
          disabled={submitting}
        >
          Avbryt
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !namn.trim() || !hasInk}
          className="btn btn-primary flex-1"
        >
          {submitting ? 'Sparar…' : 'Bekräfta'}
        </button>
      </div>
    </div>
  )
}
