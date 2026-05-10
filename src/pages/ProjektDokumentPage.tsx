import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, FileText, ImageIcon, Paperclip, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { ProjektDokument } from '../lib/types'
import { Loading } from '../components/Loading'
import { EmptyState } from '../components/EmptyState'
import { fmtDateTime } from '../lib/format'

const BUCKET = 'projekt-dokument'

function isImage(mime: string): boolean {
  return mime.startsWith('image/')
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} kB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function safeFilename(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
}

export function ProjektDokumentPage({ projektId }: { projektId: string }) {
  const [items, setItems] = useState<ProjektDokument[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [thumbs, setThumbs] = useState<Record<string, string>>({})

  const [photos, setPhotos] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const photoInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoPreviews = useMemo(
    () => photos.map((f) => (f.type.startsWith('image/') ? URL.createObjectURL(f) : null)),
    [photos],
  )
  useEffect(() => () => { photoPreviews.forEach((u) => { if (u) URL.revokeObjectURL(u) }) }, [photoPreviews])

  async function load() {
    setError(null)
    const { data, error } = await supabase
      .from('projekt_dokument')
      .select('*')
      .eq('projekt_id', projektId)
      .order('skapad_at', { ascending: false })
    if (error) { setError(error.message); return }
    setItems((data ?? []) as ProjektDokument[])
  }

  useEffect(() => { void load() }, [projektId])

  useEffect(() => {
    if (!items) return
    const missing = items.filter((d) => isImage(d.mime_type) && !thumbs[d.id])
    if (missing.length === 0) return
    void (async () => {
      const results = await Promise.all(
        missing.map((d) => supabase.storage.from(BUCKET).createSignedUrl(d.storage_path, 3600))
      )
      const next: Record<string, string> = {}
      results.forEach(({ data }, i) => {
        if (data?.signedUrl) next[missing[i].id] = data.signedUrl
      })
      if (Object.keys(next).length > 0) setThumbs((prev) => ({ ...prev, ...next }))
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  function handleAddPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files ?? [])
    if (incoming.length > 0) setPhotos((prev) => [...prev, ...incoming])
    e.target.value = ''
  }

  function handleRemovePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleUpload() {
    if (photos.length === 0) return
    setFormError(null)
    setUploading(true)
    try {
      const uploaded: { path: string; file: File }[] = []
      for (const file of photos) {
        const path = `${projektId}/${Date.now()}_${safeFilename(file.name)}`
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false })
        if (error) {
          setFormError(`Kunde inte ladda upp ${file.name}: ${error.message}`)
          return
        }
        uploaded.push({ path, file })
      }

      if (uploaded.length > 0) {
        const { error: docErr } = await supabase.from('projekt_dokument').insert(
          uploaded.map(({ path, file }) => ({
            projekt_id: projektId,
            filnamn: file.name,
            mime_type: file.type,
            storlek: file.size,
            storage_path: path,
          }))
        )
        if (docErr) { setFormError(docErr.message); return }
      }

      setPhotos([])
      await load()
    } finally {
      setUploading(false)
    }
  }

  async function openDoc(d: ProjektDokument) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(d.storage_path, 300)
    if (error || !data?.signedUrl) {
      setFormError(error?.message ?? 'Kunde inte öppna filen')
      return
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  if (error) return <div className="px-5 py-6 text-sm text-danger">{error}</div>
  if (!items) return <Loading />

  return (
    <div className="flex flex-col">
      <div className="px-4 py-3 border-b border-border bg-bg sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-subtle">Filer</span>
          {photos.length > 0 && (
            <span className="text-[11px] text-muted">{photos.length} valda</span>
          )}
        </div>
        {photos.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-2">
            {photoPreviews.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border bg-elevated">
                {src ? (
                  <img src={src} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted gap-1 px-1">
                    <FileText size={20} />
                    <span className="text-[9px] text-fg text-center truncate w-full">{photos[i].name}</span>
                  </div>
                )}
                {!uploading && (
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(i)}
                    aria-label="remove"
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-bg/80 text-fg flex items-center justify-center"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs text-muted active:text-fg active:bg-hover transition-colors disabled:opacity-50 py-2 rounded-md border border-border"
          >
            <Camera size={14} />
            Bilder
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs text-muted active:text-fg active:bg-hover transition-colors disabled:opacity-50 py-2 rounded-md border border-border"
          >
            <Paperclip size={14} />
            Fil (PDF mm.)
          </button>
        </div>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleAddPhotos}
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleAddPhotos}
        />
        {photos.length > 0 && (
          <button
            type="button"
            onClick={() => void handleUpload()}
            disabled={uploading}
            className="w-full mt-3 py-2.5 text-sm font-semibold bg-accent text-accent-fg rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Laddar upp…' : `Ladda upp ${photos.length} ${photos.length === 1 ? 'fil' : 'filer'}`}
          </button>
        )}
        {formError && (
          <p className="text-xs text-red-400 mt-2">{formError}</p>
        )}
      </div>

      {items.length === 0 && photos.length === 0 ? (
        <EmptyState
          icon={<FileText size={28} />}
          title="Inga dokument än"
          description="Lägg till bilder eller filer med knapparna ovan."
        />
      ) : (
        <ul>
          {items.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => void openDoc(d)}
                className="w-full flex items-center gap-3 px-5 py-3 border-b border-border active:bg-hover transition-colors text-left"
              >
                {isImage(d.mime_type) && thumbs[d.id] ? (
                  <img
                    src={thumbs[d.id]}
                    alt={d.filnamn}
                    loading="lazy"
                    decoding="async"
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
    </div>
  )
}
