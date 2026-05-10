import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Camera, FileText, Paperclip, X, Loader2, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNav } from '../lib/navigation'

const BUCKET = 'kvitton'

function safeFilename(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
}

export function KvittoCreatePage() {
  const { pop } = useNav()

  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState(0)

  const photoInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const previews = useMemo(
    () => files.map((f) => (f.type.startsWith('image/') ? URL.createObjectURL(f) : null)),
    [files],
  )
  useEffect(() => () => { previews.forEach((u) => { if (u) URL.revokeObjectURL(u) }) }, [previews])

  function handleAdd(e: ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files ?? [])
    if (incoming.length > 0) setFiles((prev) => [...prev, ...incoming])
    e.target.value = ''
  }

  function handleRemove(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleUpload() {
    if (files.length === 0) return
    setError(null)
    setUploading(true)
    try {
      const { data: userResult } = await supabase.auth.getUser()
      const skapadAv = userResult.user?.id ?? null
      const year = new Date().getFullYear()

      const uploaded: { path: string; file: File }[] = []
      for (const file of files) {
        const path = `${year}/${Date.now()}_${safeFilename(file.name)}`
        const mimeType = file.type || 'application/octet-stream'
        const { error: storageErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: mimeType, upsert: false })
        if (storageErr) {
          setError(`Kunde inte ladda upp ${file.name}: ${storageErr.message}`)
          return
        }
        uploaded.push({ path, file })
      }

      if (uploaded.length > 0) {
        const { error: dbErr } = await supabase.from('kvitton').insert(
          uploaded.map(({ path, file }) => ({
            fil_storage_path: path,
            fil_namn: file.name,
            mime_type: file.type || 'application/octet-stream',
            storlek: file.size,
            skapad_av_user_id: skapadAv,
          })),
        )
        if (dbErr) {
          setError(dbErr.message)
          return
        }
      }

      setSavedCount((n) => n + uploaded.length)
      setFiles([])
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="px-5 py-4 border-b border-border">
        <p className="text-[11px] uppercase tracking-widest text-muted">Snabbuppladdning</p>
        <h2 className="text-base font-semibold text-fg mt-1">Lägg till kvitto</h2>
        <p className="text-xs text-muted mt-1">
          Ladda upp bild eller PDF. Detaljer (leverantör, belopp, kategori) fyller du i från CRM senare.
        </p>
      </div>

      {savedCount > 0 && files.length === 0 && (
        <div className="mx-5 mt-4 px-4 py-3 rounded-lg border border-emerald-400/30 bg-emerald-400/10 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <p className="text-xs text-fg">
            {savedCount === 1 ? '1 kvitto sparat' : `${savedCount} kvitton sparade`}.
          </p>
        </div>
      )}

      <div className="px-4 py-3 border-b border-border bg-bg sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-subtle">Filer</span>
          {files.length > 0 && (
            <span className="text-[11px] text-muted">{files.length} valda</span>
          )}
        </div>

        {files.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-3">
            {files.map((f, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border bg-elevated">
                {previews[i] ? (
                  <img src={previews[i]!} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted gap-1 px-1">
                    <FileText size={20} />
                    <span className="text-[9px] text-fg text-center truncate w-full">{f.name}</span>
                  </div>
                )}
                {!uploading && (
                  <button
                    type="button"
                    onClick={() => handleRemove(i)}
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
          onChange={handleAdd}
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleAdd}
        />

        {files.length > 0 && (
          <button
            type="button"
            onClick={() => void handleUpload()}
            disabled={uploading}
            className="w-full mt-3 py-3 text-sm font-semibold bg-accent text-accent-fg rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading
              ? <><Loader2 size={16} className="animate-spin" />Laddar upp…</>
              : `Ladda upp ${files.length} ${files.length === 1 ? 'fil' : 'filer'}`}
          </button>
        )}

        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      </div>

      {savedCount > 0 && files.length === 0 && (
        <div className="px-5 pt-4 pb-6">
          <button
            type="button"
            onClick={pop}
            className="btn btn-ghost w-full"
          >
            Klar
          </button>
        </div>
      )}
    </div>
  )
}
