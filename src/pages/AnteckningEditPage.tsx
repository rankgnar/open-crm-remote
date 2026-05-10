import { useEffect, useState } from 'react'
import { Save, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNav } from '../lib/navigation'
import type { Farg, ProjektAnteckning } from '../lib/types'
import { FARG_DOT } from '../lib/types'
import { Loading } from '../components/Loading'

const COLORS: Farg[] = ['emerald', 'blue', 'amber', 'red', 'muted']

interface Props {
  projektId: string
  anteckningId?: string
}

export function AnteckningEditPage({ projektId, anteckningId }: Props) {
  const { pop } = useNav()
  const isNew = !anteckningId

  const [titel, setTitel] = useState('')
  const [innehall, setInnehall] = useState('')
  const [farg, setFarg] = useState<Farg>('emerald')
  const [loaded, setLoaded] = useState(isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isNew) return
    void (async () => {
      const { data, error: e } = await supabase
        .from('projekt_anteckningar')
        .select('*')
        .eq('id', anteckningId)
        .maybeSingle()
      if (e) { setError(e.message); setLoaded(true); return }
      if (!data) { setError('Anteckningen hittades inte.'); setLoaded(true); return }
      const a = data as ProjektAnteckning
      setTitel(a.titel ?? '')
      setInnehall(a.innehall ?? '')
      setFarg(a.farg ?? 'emerald')
      setLoaded(true)
    })()
  }, [isNew, anteckningId])

  async function save() {
    if (!titel.trim() && !innehall.trim()) {
      setError('Skriv minst en rubrik eller text.')
      return
    }
    setError(null)
    setSaving(true)

    if (isNew) {
      const { error: e } = await supabase.from('projekt_anteckningar').insert({
        projekt_id: projektId,
        titel: titel.trim(),
        innehall: innehall.trim(),
        farg,
      })
      setSaving(false)
      if (e) { setError(e.message); return }
    } else {
      const { error: e } = await supabase
        .from('projekt_anteckningar')
        .update({
          titel: titel.trim(),
          innehall: innehall.trim(),
          farg,
        })
        .eq('id', anteckningId)
      setSaving(false)
      if (e) { setError(e.message); return }
    }
    pop()
  }

  async function remove() {
    if (!anteckningId) return
    if (!confirm('Radera anteckning?')) return
    setSaving(true)
    const { error: e } = await supabase.from('projekt_anteckningar').delete().eq('id', anteckningId)
    setSaving(false)
    if (e) { setError(e.message); return }
    pop()
  }

  if (!loaded) return <Loading />

  return (
    <div className="flex flex-col p-5 gap-4">
      <label className="block">
        <span className="field-label">Rubrik</span>
        <input
          className="input"
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          placeholder="t.ex. Felmått köksvägg"
          autoFocus={isNew}
        />
      </label>

      <label className="block">
        <span className="field-label">Text</span>
        <textarea
          className="input min-h-40"
          rows={8}
          value={innehall}
          onChange={(e) => setInnehall(e.target.value)}
          placeholder="Anteckning…"
        />
      </label>

      <div>
        <span className="field-label">Färg</span>
        <div className="flex items-center gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFarg(c)}
              className={`h-9 w-9 rounded-full border-2 flex items-center justify-center transition-colors ${
                farg === c ? 'border-fg' : 'border-border'
              }`}
              aria-label={c}
            >
              <span className={`h-4 w-4 rounded-full ${FARG_DOT[c]}`} />
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-lg bg-danger-soft text-danger text-xs">{error}</div>
      )}

      <div className="flex flex-col gap-2 mt-2">
        <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
          <Save size={16} />
          {saving ? 'Sparar…' : 'Spara'}
        </button>
        {!isNew && (
          <button type="button" className="btn btn-danger" onClick={remove} disabled={saving}>
            <Trash2 size={16} />
            Radera
          </button>
        )}
      </div>
    </div>
  )
}
