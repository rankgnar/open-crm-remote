import { Users, Briefcase, Calendar, MessageCircle } from 'lucide-react'
import type { TabId } from '../lib/navigation'
import { useUnreadTotal } from '../lib/chat'

interface BottomNavProps {
  active: TabId
  onChange: (tab: TabId) => void
}

const items: Array<{ id: TabId; label: string; Icon: typeof Users }> = [
  { id: 'kunder',    label: 'Kunder',   Icon: Users },
  { id: 'kalender',  label: 'Kalender', Icon: Calendar },
  { id: 'projekt',   label: 'Projekt',  Icon: Briefcase },
  { id: 'chat',      label: 'Chat',     Icon: MessageCircle },
]

export function BottomNav({ active, onChange }: BottomNavProps) {
  const unread = useUnreadTotal()

  return (
    <nav className="safe-bottom sticky bottom-0 z-20 bg-bg/95 backdrop-blur border-t border-border">
      <ul className="flex">
        {items.map(({ id, label, Icon }) => {
          const isActive = active === id
          const showBadge = id === 'chat' && unread > 0
          return (
            <li key={id} className="flex-1">
              <button
                type="button"
                onClick={() => onChange(id)}
                className={`w-full flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] transition-colors ${
                  isActive ? 'text-accent' : 'text-muted hover:text-fg'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="relative">
                  <Icon size={22} strokeWidth={isActive ? 2.25 : 1.75} />
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-danger text-white text-[10px] font-semibold leading-none flex items-center justify-center tabular-nums">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </span>
                <span className="text-[11px] font-medium leading-none">{label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
