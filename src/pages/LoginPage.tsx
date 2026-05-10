import { useState } from 'react'
import { Sun, Moon, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/theme'
import { useForetag } from '../lib/foretag'

export function LoginPage() {
  const { theme, toggle } = useTheme()
  const { logoUrl, namn: foretagNamn, loading: foretagLoading } = useForetag()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errMsg, setErrMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrMsg(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setErrMsg(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col px-5 py-6 relative overflow-hidden safe-top safe-bottom">
      <div
        aria-hidden
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full pointer-events-none opacity-60"
        style={{ background: 'radial-gradient(closest-side, var(--accent-soft), transparent 70%)' }}
      />

      <div className="flex items-center justify-end relative z-10">
        <button
          type="button"
          onClick={toggle}
          className="icon-btn bg-surface/70 backdrop-blur border border-border"
          aria-label="Tema"
          title={theme === 'dark' ? 'Ljust' : 'Mörkt'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8 min-h-[88px]">
            {!foretagLoading && (
              <>
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={foretagNamn ?? ''}
                    className="h-16 max-w-[260px] object-contain mx-auto mb-4"
                  />
                ) : foretagNamn ? (
                  <h1 className="text-2xl font-semibold text-fg tracking-tight mb-4">
                    {foretagNamn}
                  </h1>
                ) : (
                  <img
                    src={theme === 'dark' ? '/branding/logo-opencrm-text-dark.png' : '/branding/logo-opencrm-text-light.png'}
                    alt="OpenCRM"
                    className="h-12 max-w-[220px] object-contain mx-auto mb-4"
                  />
                )}
                <p className="text-sm text-muted mt-1.5">Adminåtkomst för fältarbete</p>
              </>
            )}
          </div>

          <form onSubmit={handleSubmit} className="card p-5 flex flex-col gap-3">
            <Field
              icon={<Mail size={15} />}
              type="email"
              placeholder="E-post"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              required
            />
            <Field
              icon={<Lock size={15} />}
              type={showPassword ? 'text' : 'password'}
              placeholder="Lösenord"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              required
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="p-2 text-subtle hover:text-fg transition-colors"
                  aria-label={showPassword ? 'Dölj lösenord' : 'Visa lösenord'}
                  title={showPassword ? 'Dölj lösenord' : 'Visa lösenord'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />

            {errMsg && (
              <div className="px-3 py-2 rounded-lg bg-danger-soft text-danger text-xs">
                {errMsg}
              </div>
            )}

            <button type="submit" className="btn btn-primary mt-1 group" disabled={loading}>
              {loading ? 'Loggar in…' : 'Logga in'}
              {!loading && (
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

interface FieldProps {
  icon: React.ReactNode
  type: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  autoComplete?: string
  required?: boolean
  trailing?: React.ReactNode
}

function Field({ icon, type, placeholder, value, onChange, autoComplete, required, trailing }: FieldProps) {
  return (
    <label className="relative block">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none">
        {icon}
      </span>
      <input
        className={`input pl-9 ${trailing ? 'pr-10' : ''}`}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
      />
      {trailing && (
        <span className="absolute right-1 top-1/2 -translate-y-1/2">
          {trailing}
        </span>
      )}
    </label>
  )
}
