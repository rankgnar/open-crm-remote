import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export interface ChatMessage {
  id: string
  personal_id: string
  fran_admin: boolean
  innehall: string
  skapad_at: string
}

export interface ChatThreadSummary {
  personal_id: string
  namn: string
  status: string
  email: string | null
  last_at: string | null
  last_innehall: string | null
  last_fran_admin: boolean | null
  unread_count: number
}

const summaryListeners = new Set<() => void>()

function notifySummaryListeners() {
  summaryListeners.forEach((l) => {
    try { l() } catch { /* ignore */ }
  })
}

export async function listChatSummary(): Promise<ChatThreadSummary[]> {
  const [personalRes, msgRes] = await Promise.all([
    supabase
      .from('personal')
      .select('id, namn, status, email, admin_last_read_chat_at')
      .order('namn', { ascending: true }),
    supabase
      .from('personal_chat')
      .select('personal_id, fran_admin, innehall, skapad_at')
      .order('skapad_at', { ascending: false }),
  ])
  if (personalRes.error) throw new Error(personalRes.error.message)
  if (msgRes.error) throw new Error(msgRes.error.message)

  const personal = (personalRes.data ?? []).filter(
    (p) => (p.status as string | null)?.toLowerCase() !== 'inaktiv',
  )
  const activeIds = new Set(personal.map((p) => p.id as string))
  const messages = (msgRes.data ?? []).filter((m) => activeIds.has(m.personal_id as string))

  const lastByPersonal = new Map<string, { innehall: string; skapad_at: string; fran_admin: boolean }>()
  const lastReadByPersonal = new Map<string, number>()
  for (const p of personal) {
    const iso = (p as { admin_last_read_chat_at: string | null }).admin_last_read_chat_at
    lastReadByPersonal.set(p.id as string, iso ? Date.parse(iso) : 0)
  }

  const unreadByPersonal = new Map<string, number>()
  for (const m of messages) {
    const pid = m.personal_id as string
    if (!lastByPersonal.has(pid)) {
      lastByPersonal.set(pid, {
        innehall: m.innehall as string,
        skapad_at: m.skapad_at as string,
        fran_admin: m.fran_admin as boolean,
      })
    }
    if (m.fran_admin) continue
    const ts = Date.parse(m.skapad_at as string)
    if (ts > (lastReadByPersonal.get(pid) ?? 0)) {
      unreadByPersonal.set(pid, (unreadByPersonal.get(pid) ?? 0) + 1)
    }
  }

  return personal.map((p) => {
    const last = lastByPersonal.get(p.id as string)
    return {
      personal_id: p.id as string,
      namn: p.namn as string,
      status: p.status as string,
      email: (p.email as string | null) ?? null,
      last_at: last?.skapad_at ?? null,
      last_innehall: last?.innehall ?? null,
      last_fran_admin: last?.fran_admin ?? null,
      unread_count: unreadByPersonal.get(p.id as string) ?? 0,
    }
  })
}

export async function listChat(personalId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('personal_chat')
    .select('*')
    .eq('personal_id', personalId)
    .order('skapad_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as ChatMessage[]
}

export async function sendChatAsAdmin(personalId: string, innehall: string): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('personal_chat')
    .insert({ personal_id: personalId, fran_admin: true, innehall })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as ChatMessage
}

export async function markChatRead(personalId: string): Promise<void> {
  const { error } = await supabase
    .from('personal')
    .update({ admin_last_read_chat_at: new Date().toISOString() })
    .eq('id', personalId)
  if (error) throw new Error(error.message)
  notifySummaryListeners()
}

function uniqueChannelName(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${Date.now()}-${rand}`
}

export function subscribeThread(
  personalId: string,
  onInsert: (msg: ChatMessage) => void,
): () => void {
  const channel = supabase
    .channel(uniqueChannelName(`chat-thread-${personalId}`))
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'personal_chat',
        filter: `personal_id=eq.${personalId}`,
      },
      (payload) => onInsert(payload.new as ChatMessage),
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

export function subscribeAll(onInsert: (msg: ChatMessage) => void): () => void {
  const channel = supabase
    .channel(uniqueChannelName('chat-summary'))
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'personal_chat',
      },
      (payload) => onInsert(payload.new as ChatMessage),
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

export function useUnreadTotal(): number {
  const [total, setTotal] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function refresh() {
      try {
        const summary = await listChatSummary()
        if (cancelled) return
        setTotal(summary.reduce((acc, s) => acc + s.unread_count, 0))
      } catch {
        // Don't crash the BottomNav if the chat queries fail; the
        // badge stays at its previous value.
      }
    }

    void refresh()
    summaryListeners.add(refresh)

    const unsubscribe = subscribeAll(() => { void refresh() })

    function onVisibility() { if (!document.hidden) void refresh() }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      summaryListeners.delete(refresh)
      unsubscribe()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return total
}
