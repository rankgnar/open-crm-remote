const dateFmt = new Intl.DateTimeFormat('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit' })
const dateLongFmt = new Intl.DateTimeFormat('sv-SE', { year: 'numeric', month: 'short', day: '2-digit' })
const dateTimeFmt = new Intl.DateTimeFormat('sv-SE', {
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit',
})
const timeFmt = new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit' })
const moneyFmt = new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 })
const numberFmt = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 2 })

export function fmtDate(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return '—'
  return dateFmt.format(d)
}

export function fmtDateLong(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return '—'
  return dateLongFmt.format(d)
}

export function fmtDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return '—'
  return dateTimeFmt.format(d)
}

export function fmtTime(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return '—'
  return timeFmt.format(d)
}

export function fmtMoney(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '—'
  return moneyFmt.format(value)
}

export function fmtNumber(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '—'
  return numberFmt.format(value)
}

export function localDay(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value)
  return dateFmt.format(d)
}

export function toIsoDateInput(value: string | Date | null | undefined): string {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

export function toIsoDateTimeInput(value: string | Date | null | undefined): string {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return ''
  const tz = d.getTimezoneOffset() * 60_000
  return new Date(d.getTime() - tz).toISOString().slice(0, 16)
}
