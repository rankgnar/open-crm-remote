import { useEffect, useState } from 'react'
import { Plus, FileText, Image as ImageIcon, CheckCircle2, Circle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Kvitto, KvittoStatus } from '../lib/types'
import { KVITTO_KATEGORIER } from '../lib/types'
import { Loading } from '../components/Loading'
import { fmtDate, fmtMoney } from '../lib/format'
import { useNav } from '../lib/navigation'

const BUCKET = 'kvitton'

type Filter = 'alla' | KvittoStatus

function isImage(mime: string): boolean {
  return mime.startsWith('image/')
}

function kategoriLabel(value: string | null): string {
  if (!value) return '—'
  return KVITTO_KATEGORIER.find((k) => k.value === value)?.label ?? value
}

export function KvittoListPage() {
  const { push } = useNav()
  const [items, setItems] = useState<Kvitto[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('alla')
  const [thumbs, setThumbs] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | null>(null)

  async function loadAll() {
    setError(null)
    const { data, error: err } = await supabase
      .from('kvitton')
      .select('*')
      .order('datum', { ascending: false })
      .order('skapad_at', { ascending: false })
    if (err) { setError(err.message); return }
    setItems((data ?? []) as Kvitto[])
  }

  useEffect(() => { void loadAll() }, [])

  useEffect(() => {
    if (!items) return
    const images = items.filter((k) => isImage(k.mime_type) && !thumbs[k.id])
    if (images.length === 0) return
    void (async () => {
      const next: Record<string, string> = {}
      for (const k of images) {
        const { data } = await supabase.storage.from(BUCKET).createSignedUrl(k.fil_storage_path, 3600)
        if (data?.signedUrl) next[k.id] = data.signedUrl
      }
      if (Object.keys(next).length > 0) {
        setThumbs((prev) => ({ ...prev, ...next }))
      }
    })()
  }, [items])

  async function toggleStatus(k: Kvitto) {
    setBusyId(k.id)
    const next: KvittoStatus = k.status === 'hanterade' ? 'att_hantera' : 'hanterade'
    const { error: err } = await supabase
      .from('kvitton')
      .update({ status: next })
      .eq('id', k.id)
    setBusyId(null)
    if (err) { setError(err.message); return }
    setItems((prev) => prev ? prev.map((x) => x.id === k.id ? { ...x, status: next } : x) : prev)
  }

  if (error) return <div className="px-5 py-6 text-sm text-red-400">{error}</div>
  if (!items) return <Loading />

  const visible = filter === 'alla' ? items : items.filter((k) => k.status === filter)
  const counts = {
    alla: items.length,
    att_hantera: items.filter((k) => k.status === 'att_hantera').length,
    hanterade: items.filter((k) => k.status === 'hanterade').length,
  }

  return (
    <div className="flex flex-col">
      <div className="px-3 pt-3 pb-2 flex gap-2">
        <button
          type="button"
          onClick={() => push({ kind: 'kvitto.create' })}
          className="btn btn-primary flex-1"
        >
          <Plus size={16} />
          Nytt kvitto
        </button>
      </div>

      <div className="px-3 pb-2 flex gap-1.5">
        {(['alla', 'att_hantera', 'hanterade'] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`flex-1 px-2 py-1.5 rounded-md text-[11px] uppercase tracking-wider transition-colors ${filter === f ? 'bg-fg text-bg' : 'bg-elevated text-muted active:bg-hover'}`}
          >
            {f === 'alla' ? 'Alla' : f === 'att_hantera' ? 'Att hantera' : 'Hanterade'}
            <span className="ml-1.5 opacity-70">{counts[f]}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="px-5 py-8 text-sm text-subtle text-center">
          {filter === 'att_hantera' ? 'Inga kvitton att hantera.'
            : filter === 'hanterade' ? 'Inga hanterade kvitton.'
            : 'Inga kvitton än. Tryck på "Nytt kvitto" för att lägga till.'}
        </p>
      ) : (
        <ul>
          {visible.map((k) => (
            <li key={k.id} className="border-t border-border">
              <div className="flex items-stretch">
                <button
                  type="button"
                  onClick={() => void toggleStatus(k)}
                  disabled={busyId === k.id}
                  className="flex items-center justify-center px-4 active:bg-hover transition-colors shrink-0 disabled:opacity-50"
                  aria-label={k.status === 'hanterade' ? 'Markera som att hantera' : 'Markera som hanterad'}
                >
                  {k.status === 'hanterade' ? (
                    <CheckCircle2 size={20} className="text-emerald-400" />
                  ) : (
                    <Circle size={20} className="text-amber-400" />
                  )}
                </button>
                <div className="flex-1 flex items-center gap-3 py-3 pr-5">
                  {isImage(k.mime_type) && thumbs[k.id] ? (
                    <img
                      src={thumbs[k.id]}
                      alt={k.fil_namn}
                      className="h-12 w-12 rounded-md object-cover bg-elevated shrink-0"
                    />
                  ) : (
                    <span className="h-12 w-12 rounded-md bg-elevated text-muted flex items-center justify-center shrink-0">
                      {isImage(k.mime_type) ? <ImageIcon size={18} /> : <FileText size={18} />}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`text-sm font-medium truncate ${k.status === 'hanterade' ? 'text-muted line-through' : k.leverantor ? 'text-fg' : 'text-amber-400 italic'}`}>
                        {k.leverantor ?? 'Saknar info'}
                      </p>
                      <span className="text-sm font-mono font-semibold text-fg shrink-0">
                        {k.belopp != null ? fmtMoney(k.belopp) : '—'}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted mt-0.5">
                      {fmtDate(k.datum)} · {kategoriLabel(k.kategori)}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
