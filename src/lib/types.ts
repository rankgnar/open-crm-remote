// Shared entity types — mirror the columns of the corresponding Supabase
// tables. Kept narrow on purpose: only fields the mobile admin app reads
// or writes. Add more as new screens need them.

export type Farg = 'emerald' | 'amber' | 'red' | 'blue' | 'muted'

export const FARG_DOT: Record<Farg, string> = {
  emerald: 'bg-emerald-400',
  amber:   'bg-amber-400',
  red:     'bg-red-400',
  blue:    'bg-blue-400',
  muted:   'bg-subtle',
}

export const FARG_TEXT: Record<Farg, string> = {
  emerald: 'text-emerald-400',
  amber:   'text-amber-400',
  red:     'text-red-400',
  blue:    'text-blue-400',
  muted:   'text-muted',
}

// ─── kunder ─────────────────────────────────────────────────────────

export interface Kund {
  id: string
  kundnummer: string | null
  namn: string
  email: string | null
  telefon: string | null
  telefon_2: string | null
  adress: string | null
  postnummer: string | null
  stad: string | null
  land: string | null
  org_nummer: string | null
  status: string
  skapad_at: string
  uppdaterad_at: string
}

export interface KundStatusar {
  id: string
  namn: string
  farg: Farg
  sortering: number
}

// ─── projekt ────────────────────────────────────────────────────────

export interface Projekt {
  id: string
  projekt_nummer: string | null
  kund_id: string
  namn: string
  beskrivning: string | null
  status: string
  startdatum: string | null
  slutdatum: string | null
  budget_total: number | null
  arbetsplats_adress: string | null
  arbetsplats_postnummer: string | null
  arbetsplats_stad: string | null
  rot_avdrag: boolean
  rot_procent: number
  rot_inkludera_medsokande: boolean
  betalningsvillkor: string | null
  villkor: string | null
  skapad_at: string
  uppdaterad_at: string
}

export interface ProjektStatusar {
  id: string
  namn: string
  farg: Farg
  sortering: number
}

// ─── projekt_anteckningar ────────────────────────────────────────────

export interface ProjektAnteckning {
  id: string
  projekt_id: string
  titel: string
  innehall: string
  farg: Farg
  skapad_at: string
}

export interface CreateAnteckningInput {
  projekt_id: string
  titel: string
  innehall: string
  farg: Farg
}

// ─── projekt_dokument ────────────────────────────────────────────────

export interface ProjektDokument {
  id: string
  projekt_id: string
  filnamn: string
  mime_type: string
  storlek: number
  storage_path: string
  skapad_at: string
}

// ─── förslag ────────────────────────────────────────────────────────

export interface Forslag {
  id: string
  projekt_id: string
  forslag_nummer: string | null
  titel: string
  status: string
  giltig_till: string | null
  moms_procent: number
  sammanfattning: string | null
  skapad_at: string
  uppdaterad_at: string
}

export interface ForslagFas {
  id: string
  forslag_id: string
  namn: string
  beskrivning: string | null
  sortering: number
  start_datum: string | null
  slut_datum: string | null
  skapad_at: string
}

export interface ForslagSubfas {
  id: string
  fas_id: string
  namn: string
  beskrivning: string | null
  sortering: number
  skapad_at: string
}

export interface ForslagArbete {
  id: string
  subfas_id: string
  beskrivning: string
  yrkesroll: string | null
  antal_timmar: number
  timpris: number
  rot_berattigad: boolean
}

export interface ForslagMaterial {
  id: string
  subfas_id: string
  beskrivning: string
  enhet: string | null
  antal: number
  a_pris: number
  leverantor: string | null
}

export interface ForslagUe {
  id: string
  subfas_id: string
  namn: string
  beskrivning: string | null
  inkl_material: boolean
  kostnad: number
}

// ─── ÄTA ────────────────────────────────────────────────────────────

export type AtaStatus = 'Utkast' | 'Skickad' | 'Godkänd' | 'Avvisad'

export interface Ata {
  id: string
  ata_nummer: string
  projekt_id: string
  kund_id: string
  kund_namn: string
  kund_org_nr: string
  titel: string
  beskrivning: string
  villkor: string | null
  status: AtaStatus
  belopp_netto: number
  belopp_moms: number
  belopp_total: number
  godkand_av: string | null
  godkand_datum: string | null
  signatur_data: string | null
  fas_id: string | null
  subfas_id: string | null
  skapad_at: string
  uppdaterad_at: string
}

export interface AtaRad {
  id: string
  ata_id: string
  beskrivning: string
  antal: number
  enhet: string
  a_pris: number
  belopp: number
  sortering: number
  skapad_at: string
}

export interface CreateAtaRadInput {
  beskrivning: string
  enhet: string
  antal: number
  a_pris: number
}

// ─── revisor ────────────────────────────────────────────────────────

export type DeadlineTyp = 'mote' | 'deklaration' | 'inlamning' | 'bokslut' | 'ovrig'
export type DeadlineStatus = 'kommande' | 'slutford' | 'forsenad'

export const DEADLINE_TYP_LABEL: Record<DeadlineTyp, string> = {
  mote:        'Möte',
  deklaration: 'Deklaration',
  inlamning:   'Inlämning',
  bokslut:     'Bokslut',
  ovrig:       'Övrigt',
}

export interface RevisorDeadline {
  id: string
  titel: string
  datum: string
  typ: DeadlineTyp
  status: DeadlineStatus
  notat: string | null
  skapad_at: string
  uppdaterad_at: string
}

export interface RevisorAnteckning {
  id: string
  titel: string
  innehall: string
  farg: Farg
  skapad_at: string
  uppdaterad_at: string
}

export interface RevisorDokument {
  id: string
  filnamn: string
  storage_path: string
  mime_type: string
  storlek: number
  skapad_at: string
}

// ─── kvitton ────────────────────────────────────────────────────────

export type KvittoStatus = 'att_hantera' | 'hanterade'

export type KvittoKategori =
  | 'drivmedel'
  | 'material'
  | 'verktyg'
  | 'kontorsmateriel'
  | 'representation'
  | 'ovrigt'

export const KVITTO_KATEGORIER: { value: KvittoKategori; label: string }[] = [
  { value: 'drivmedel',       label: 'Drivmedel' },
  { value: 'material',        label: 'Material' },
  { value: 'verktyg',         label: 'Verktyg' },
  { value: 'kontorsmateriel', label: 'Kontorsmateriel' },
  { value: 'representation',  label: 'Representation' },
  { value: 'ovrigt',          label: 'Övrigt' },
]

export interface Kvitto {
  id: string
  datum: string
  leverantor: string | null
  belopp: number | null
  moms: number | null
  kategori: KvittoKategori | null
  beskrivning: string | null
  projekt_id: string | null
  status: KvittoStatus
  fil_storage_path: string
  fil_namn: string
  mime_type: string
  storlek: number
  fortnox_voucher_id: string | null
  skapad_av_user_id: string | null
  skapad_at: string
  uppdaterad_at: string
}

// ─── kalender ───────────────────────────────────────────────────────

export interface KalenderEvent {
  id: string
  titel: string
  beskrivning: string
  plats: string
  start: string
  slut: string
  hel_dag: boolean
  aterkommer: boolean
  deltagare: string[]
  kund_id: string | null
  projekt_id: string | null
  url: string
  farg: string
  slutford: boolean
  skapad_at: string
  uppdaterad_at: string
}
