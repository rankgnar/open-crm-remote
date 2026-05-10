import { useEffect, useRef, useState } from 'react'
import {
  Plus, X, Camera, Upload, FileText, ImageIcon, Loader2, Calendar, StickyNote, CheckCircle2, Circle,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import type {
  RevisorDeadline, RevisorAnteckning, RevisorDokument,
  DeadlineTyp, DeadlineStatus, Farg,
} from '../lib/types'
import { DEADLINE_TYP_LABEL, FARG_DOT } from '../lib/types'
import { Loading } from '../components/Loading'
import { fmtDate, fmtDateTime } from '../lib/format'

const REVISOR_BUCKET = 'revisor-dokument'

export function RevisorPage() {
  const [deadlines, setDeadlines] = useState<RevisorDeadline[] | null>(null)
  const [anteckningar, setAnteckningar] = useState<RevisorAnteckning[] | null>(null)
  const [dokument, setDokument] = useState<RevisorDokument[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadAll() {
    setError(null)
    const [d, a, dok] = await Promise.all([
      supabase.from('revisor_deadlines').select('*').order('datum', { ascending: true }),
      supabase.from('revisor_anteckningar').select('*').order('skapad_at', { ascending: false }),
      supabase.from('revisor_dokument').select('*').order('skapad_at', { ascending: false }),
    ])
    if (d.error) { setError(d.error.message); return }
    if (a.error) { setError(a.error.message); return }
    if (dok.error) { setError(dok.error.message); return }
    setDeadlines((d.data ?? []) as RevisorDeadline[])
    setAnteckningar((a.data ?? []) as RevisorAnteckning[])
    setDokument((dok.data ?? []) as RevisorDokument[])
  }

  useEffect(() => { void loadAll() }, [])

  if (error) return <div className="px-5 py-6 text-sm text-danger">{error}</div>
  if (!deadlines || !anteckningar || !dokument) return <Loading />

  return (
    <div className="flex flex-col">
      <DeadlinesSection items={deadlines} reload={loadAll} />
      <AnteckningarSection items={anteckningar} reload={loadAll} />
      <DokumentSection items={dokument} reload={loadAll} />
    </div>
  )
}

// ─── Deadlines ──────────────────────────────────────────────────────

function DeadlinesSection({ items, reload }: { items: RevisorDeadline[]; reload: () => Promise<void> }) {
  const [creating, setCreating] = useState(false)

  async function toggle(d: RevisorDeadline) {
    const next: DeadlineStatus = d.status === 'slutford' ? 'kommande' : 'slutford'
    const { error } = await supabase
      .from('revisor_deadlines')
      .update({ status: next, uppdaterad_at: new Date().toISOString() })
      .eq('id', d.id)
    if (!error) await reload()
  }

  return (
    <section className="border-b border-border">
      <SectionHeader
        title="Deadlines"
        count={items.length}
        creating={creating}
        onToggle={() => setCreating((v) => !v)}
      />

      {creating && (
        <DeadlineForm
          onCancel={() => setCreating(false)}
          onCreated={async () => { setCreating(false); await reload() }}
        />
      )}

      {items.length === 0 && !creating ? (
        <p className="px-5 pb-5 text-sm text-subtle">Inga deadlines än.</p>
      ) : (
        <ul>
          {items.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => void toggle(d)}
                className="w-full flex items-center gap-3 px-5 py-3 border-t border-border active:bg-hover transition-colors text-left"
              >
                {d.status === 'slutford' ? (
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                ) : (
                  <Circle size={18} className="text-subtle shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${d.status === 'slutford' ? 'text-muted line-through' : 'text-fg'}`}>
                    {d.titel}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    <span className="badge badge-neutral mr-2">{DEADLINE_TYP_LABEL[d.typ]}</span>
                    {fmtDate(d.datum)}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function DeadlineForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: () => Promise<void> }) {
  const [titel, setTitel] = useState('')
  const [datum, setDatum] = useState('')
  const [typ, setTyp] = useState<DeadlineTyp>('ovrig')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (!titel.trim()) { setError('Ange titel'); return }
    if (!datum) { setError('Ange datum'); return }
    setError(null)
    setSubmitting(true)
    const { error } = await supabase.from('revisor_deadlines').insert({
      titel: titel.trim(),
      datum,
      typ,
      status: 'kommande',
    })
    setSubmitting(false)
    if (error) { setError(error.message); return }
    await onCreated()
  }

  return (
    <div className="px-5 py-4 border-t border-border bg-elevated/30 flex flex-col gap-2.5">
      <input
        type="text"
        className="input"
        placeholder="Titel"
        value={titel}
        onChange={(e) => setTitel(e.target.value)}
        autoFocus
      />
      <div className="flex gap-2">
        <input
          type="date"
          className="input flex-1"
          value={datum}
          onChange={(e) => setDatum(e.target.value)}
        />
        <select
          className="input flex-1"
          value={typ}
          onChange={(e) => setTyp(e.target.value as DeadlineTyp)}
        >
          {(Object.keys(DEADLINE_TYP_LABEL) as DeadlineTyp[]).map((k) => (
            <option key={k} value={k}>{DEADLINE_TYP_LABEL[k]}</option>
          ))}
        </select>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="btn btn-ghost flex-1" disabled={submitting}>
          Avbryt
        </button>
        <button type="button" onClick={submit} className="btn btn-primary flex-1" disabled={submitting}>
          {submitting ? 'Sparar…' : 'Spara'}
        </button>
      </div>
    </div>
  )
}

// ─── Anteckningar ───────────────────────────────────────────────────

function AnteckningarSection({ items, reload }: { items: RevisorAnteckning[]; reload: () => Promise<void> }) {
  const [creating, setCreating] = useState(false)

  return (
    <section className="border-b border-border">
      <SectionHeader
        title="Anteckningar"
        count={items.length}
        creating={creating}
        onToggle={() => setCreating((v) => !v)}
      />

      {creating && (
        <AnteckningForm
          onCancel={() => setCreating(false)}
          onCreated={async () => { setCreating(false); await reload() }}
        />
      )}

      {items.length === 0 && !creating ? (
        <p className="px-5 pb-5 text-sm text-subtle">Inga anteckningar än.</p>
      ) : (
        <div className="relative py-3">
          <div className="absolute left-[26px] top-3 bottom-3 w-px bg-border" />
          <ul>
            {items.map((a) => {
              const farg = (a.farg as Farg) ?? 'muted'
              return (
                <li key={a.id} className="flex gap-3 px-5 pb-4 last:pb-0">
                  <span className={`relative z-10 mt-1.5 size-3 rounded-full shrink-0 ring-2 ring-bg ${FARG_DOT[farg]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-fg truncate">{a.titel || '(utan rubrik)'}</p>
                      <span className="text-[11px] text-subtle shrink-0">{fmtDateTime(a.skapad_at)}</span>
                    </div>
                    {a.innehall && (
                      <p className="text-xs text-muted mt-1 whitespace-pre-wrap">{a.innehall}</p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}

function AnteckningForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: () => Promise<void> }) {
  const [titel, setTitel] = useState('')
  const [innehall, setInnehall] = useState('')
  const [farg, setFarg] = useState<Farg>('muted')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (!titel.trim()) { setError('Ange titel'); return }
    setError(null)
    setSubmitting(true)
    const { error } = await supabase.from('revisor_anteckningar').insert({
      titel: titel.trim(),
      innehall: innehall.trim(),
      farg,
    })
    setSubmitting(false)
    if (error) { setError(error.message); return }
    await onCreated()
  }

  const fargs: Farg[] = ['muted', 'emerald', 'amber', 'red', 'blue']

  return (
    <div className="px-5 py-4 border-t border-border bg-elevated/30 flex flex-col gap-2.5">
      <input
        type="text"
        className="input"
        placeholder="Titel"
        value={titel}
        onChange={(e) => setTitel(e.target.value)}
        autoFocus
      />
      <textarea
        className="input resize-none"
        rows={3}
        placeholder="Innehåll (valfritt)"
        value={innehall}
        onChange={(e) => setInnehall(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted">Färg:</span>
        {fargs.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFarg(f)}
            className={`size-5 rounded-full ${FARG_DOT[f]} ${farg === f ? 'ring-2 ring-fg ring-offset-2 ring-offset-bg' : ''}`}
            aria-label={f}
          />
        ))}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="btn btn-ghost flex-1" disabled={submitting}>
          Avbryt
        </button>
        <button type="button" onClick={submit} className="btn btn-primary flex-1" disabled={submitting}>
          {submitting ? 'Sparar…' : 'Spara'}
        </button>
      </div>
    </div>
  )
}

// ─── Dokument ───────────────────────────────────────────────────────

function isImage(mime: string): boolean {
  return mime.startsWith('image/')
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} kB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function safeFilename(name: string): string {
  const dot = name.lastIndexOf('.')
  const base = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ''
  const safe = base.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${safe}${ext}`
}

function DokumentSection({ items, reload }: { items: RevisorDokument[]; reload: () => Promise<void> }) {
  const [thumbs, setThumbs] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const images = items.filter((d) => isImage(d.mime_type) && !thumbs[d.id])
    if (images.length === 0) return
    void (async () => {
      const next: Record<string, string> = {}
      for (const img of images) {
        const { data } = await supabase.storage.from(REVISOR_BUCKET).createSignedUrl(img.storage_path, 3600)
        if (data?.signedUrl) next[img.id] = data.signedUrl
      }
      if (Object.keys(next).length > 0) {
        setThumbs((prev) => ({ ...prev, ...next }))
      }
    })()
  }, [items])

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploadError(null)
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const safe = safeFilename(file.name)
        const storagePath = `${Date.now()}_${safe}`
        const { error: storageErr } = await supabase.storage
          .from(REVISOR_BUCKET)
          .upload(storagePath, file, { contentType: file.type || 'application/octet-stream', upsert: false })
        if (storageErr) throw new Error(storageErr.message)
        const { error: dbErr } = await supabase.from('revisor_dokument').insert({
          filnamn: file.name,
          mime_type: file.type || 'application/octet-stream',
          storlek: file.size,
          storage_path: storagePath,
        })
        if (dbErr) throw new Error(dbErr.message)
      }
      await reload()
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Uppladdning misslyckades')
    } finally {
      setUploading(false)
    }
  }

  async function openDoc(d: RevisorDokument) {
    const { data, error } = await supabase.storage.from(REVISOR_BUCKET).createSignedUrl(d.storage_path, 300)
    if (error || !data?.signedUrl) {
      setUploadError(error?.message ?? 'Kunde inte öppna filen')
      return
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <section>
      <div className="px-5 pt-5 pb-2 flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-widest text-muted">
          Dokument <span className="ml-1 text-subtle">{items.length}</span>
        </p>
      </div>

      <div className="px-3 pb-3 flex gap-2">
        <button
          type="button"
          className="btn btn-primary flex-1"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          Lägg till fil
        </button>
        <button
          type="button"
          className="btn btn-ghost flex-1"
          disabled={uploading}
          onClick={() => cameraInputRef.current?.click()}
        >
          <Camera size={16} />
          Ta foto
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => { void uploadFiles(e.target.files); e.target.value = '' }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => { void uploadFiles(e.target.files); e.target.value = '' }}
        />
      </div>

      {uploadError && (
        <div className="px-5 pb-2 text-xs text-red-400">{uploadError}</div>
      )}

      {items.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-subtle">Inga dokument än.</p>
      ) : (
        <ul>
          {items.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => void openDoc(d)}
                className="w-full flex items-center gap-3 px-5 py-3 border-t border-border active:bg-hover transition-colors text-left"
              >
                {isImage(d.mime_type) && thumbs[d.id] ? (
                  <img
                    src={thumbs[d.id]}
                    alt={d.filnamn}
                    className="h-12 w-12 rounded-md object-cover bg-elevated shrink-0"
                  />
                ) : (
                  <span className="h-12 w-12 rounded-md bg-elevated text-muted flex items-center justify-center shrink-0">
                    {isImage(d.mime_type) ? <ImageIcon size={20} /> : <FileText size={20} />}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-fg truncate">{d.filnamn}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {fmtSize(d.storlek)} · {fmtDateTime(d.skapad_at)}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ─── Shared ─────────────────────────────────────────────────────────

function SectionHeader({
  title,
  count,
  creating,
  onToggle,
}: {
  title: string
  count: number
  creating: boolean
  onToggle: () => void
}) {
  const Icon = title === 'Deadlines' ? Calendar : title === 'Anteckningar' ? StickyNote : FileText
  return (
    <div className="px-5 pt-5 pb-2 flex items-center justify-between">
      <p className="text-[11px] uppercase tracking-widest text-muted flex items-center gap-2">
        <Icon size={12} />
        {title}
        <span className="text-subtle">{count}</span>
      </p>
      <button
        type="button"
        onClick={onToggle}
        className="icon-btn"
        aria-label={creating ? 'Avbryt' : `Ny ${title.toLowerCase()}`}
      >
        {creating ? <X size={18} /> : <Plus size={18} />}
      </button>
    </div>
  )
}
