import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import {
  listChat,
  markChatRead,
  sendChatAsAdmin,
  subscribeThread,
  type ChatMessage,
} from '../lib/chat'

interface Props {
  personalId: string
}

export function ChatThreadPage({ personalId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [innehall, setInnehall] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    listChat(personalId)
      .then((list) => {
        if (cancelled) return
        setMessages(list)
        setLoaded(true)
        if (!document.hidden) void markChatRead(personalId).catch(() => {})
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message)
      })

    const unsubscribe = subscribeThread(personalId, (msg) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
      if (!document.hidden) void markChatRead(personalId).catch(() => {})
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [personalId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = innehall.trim()
    if (!text || sending) return
    setError(null)
    setSending(true)
    try {
      const created = await sendChatAsAdmin(personalId, text)
      setMessages((prev) => (prev.some((m) => m.id === created.id) ? prev : [...prev, created]))
      setInnehall('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {!loaded ? (
          <p className="text-xs text-subtle text-center py-8">Laddar…</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-subtle text-center py-8">Inga meddelanden än.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {messages.map((m) => (
              <Bubble key={m.id} message={m} />
            ))}
          </ul>
        )}
      </div>

      {error && (
        <div className="px-4 py-2 bg-danger-soft border-t border-border">
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 px-3 py-3 border-t border-border bg-surface shrink-0"
      >
        <textarea
          rows={1}
          className="flex-1 bg-elevated border border-border rounded-2xl px-3.5 py-2.5 text-sm text-fg outline-none resize-none placeholder:text-subtle min-h-[40px] max-h-32"
          placeholder="Skriv ett meddelande…"
          value={innehall}
          onChange={(e) => setInnehall(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void handleSubmit(e as unknown as React.FormEvent)
            }
          }}
        />
        <button
          type="submit"
          disabled={!innehall.trim() || sending}
          className="h-10 w-10 shrink-0 rounded-full bg-accent text-accent-fg flex items-center justify-center disabled:opacity-45 disabled:cursor-not-allowed"
          aria-label="Skicka"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}

function Bubble({ message }: { message: ChatMessage }) {
  const own = message.fran_admin
  return (
    <li className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words ${
          own
            ? 'bg-accent text-accent-fg rounded-br-sm'
            : 'bg-elevated text-fg border border-border rounded-bl-sm'
        }`}
      >
        <p>{message.innehall}</p>
        <p className={`text-[10px] mt-1 tabular-nums ${own ? 'text-accent-fg/70' : 'text-subtle'}`}>
          {formatTime(message.skapad_at)}
        </p>
      </div>
    </li>
  )
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('sv-SE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
