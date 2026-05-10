import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type TabId = 'kunder' | 'projekt' | 'kalender' | 'chat'

export type View =
  | { kind: 'kunder.list' }
  | { kind: 'kund.detail'; id: string }
  | { kind: 'projekt.list' }
  | { kind: 'projekt.detail'; id: string }
  | { kind: 'projekt.info'; projektId: string }
  | { kind: 'projekt.anteckningar'; projektId: string }
  | { kind: 'projekt.anteckning.edit'; projektId: string; anteckningId?: string }
  | { kind: 'projekt.forslag'; projektId: string }
  | { kind: 'projekt.ata'; projektId: string }
  | { kind: 'projekt.dokument'; projektId: string }
  | { kind: 'forslag.detail'; projektId: string; forslagId: string }
  | { kind: 'tidplan.detail'; projektId: string; forslagId: string }
  | { kind: 'ata.detail'; id: string }
  | { kind: 'ata.create'; projektId?: string }
  | { kind: 'ata.sign'; id: string }
  | { kind: 'kalender.list' }
  | { kind: 'kalender.detail'; id: string }
  | { kind: 'kalender.edit'; id?: string; defaultProjektId?: string }
  | { kind: 'revisor' }
  | { kind: 'kvitto.list' }
  | { kind: 'kvitto.create' }
  | { kind: 'chat.list' }
  | { kind: 'chat.thread'; personalId: string; namn: string }

type Stacks = Record<TabId, View[]>

const ROOT_VIEW: Record<TabId, View> = {
  kunder:   { kind: 'kunder.list' },
  projekt:  { kind: 'projekt.list' },
  kalender: { kind: 'kalender.list' },
  chat:     { kind: 'chat.list' },
}

const initialStacks: Stacks = {
  kunder:   [ROOT_VIEW.kunder],
  projekt:  [ROOT_VIEW.projekt],
  kalender: [ROOT_VIEW.kalender],
  chat:     [ROOT_VIEW.chat],
}

// Android Chrome suspende la PWA cuando el user abre el file picker o
// la cámara, y al volver remonta toda la app. Sin persistencia, el
// stack de navegación se resetea (vuelves a home) y se pierde el
// archivo recién seleccionado. sessionStorage sobrevive a la
// suspensión y se limpia al cerrar la pestaña.
const NAV_STORAGE_KEY = 'crm-remote-nav-v1'
const VALID_TABS: TabId[] = ['kunder', 'projekt', 'kalender']

interface PersistedNav { tab: TabId; stacks: Stacks }

function loadPersistedNav(): PersistedNav | null {
  try {
    const raw = typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem(NAV_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PersistedNav>
    if (!parsed?.tab || !parsed?.stacks) return null
    if (!VALID_TABS.includes(parsed.tab)) return null
    for (const t of VALID_TABS) {
      if (!Array.isArray(parsed.stacks[t]) || parsed.stacks[t].length === 0) return null
    }
    return parsed as PersistedNav
  } catch {
    return null
  }
}

interface NavContextValue {
  tab: TabId
  current: View
  canGoBack: boolean
  setTab: (tab: TabId) => void
  push: (view: View) => void
  pop: () => void
  reset: (tab: TabId) => void
}

const NavContext = createContext<NavContextValue | null>(null)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const persisted = loadPersistedNav()
  const [tab, setTabState] = useState<TabId>(persisted?.tab ?? 'kalender')
  const [stacks, setStacks] = useState<Stacks>(persisted?.stacks ?? initialStacks)

  useEffect(() => {
    try {
      sessionStorage.setItem(NAV_STORAGE_KEY, JSON.stringify({ tab, stacks }))
    } catch {
      // sessionStorage may be unavailable (private mode, quota, etc.)
    }
  }, [tab, stacks])

  const stack = stacks[tab]
  const current = stack[stack.length - 1]
  const canGoBack = stack.length > 1

  function setTab(next: TabId) {
    if (next === tab && canGoBack) {
      // Tap the same tab again: pop to its root.
      setStacks((s) => ({ ...s, [tab]: [ROOT_VIEW[tab]] }))
    } else {
      setTabState(next)
    }
  }

  function push(view: View) {
    setStacks((s) => ({ ...s, [tab]: [...s[tab], view] }))
  }

  function pop() {
    setStacks((s) => {
      const cur = s[tab]
      if (cur.length <= 1) return s
      return { ...s, [tab]: cur.slice(0, -1) }
    })
  }

  function reset(t: TabId) {
    setStacks((s) => ({ ...s, [t]: [ROOT_VIEW[t]] }))
  }

  const value: NavContextValue = { tab, current, canGoBack, setTab, push, pop, reset }
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>
}

export function useNav(): NavContextValue {
  const ctx = useContext(NavContext)
  if (!ctx) throw new Error('useNav must be used inside <NavigationProvider>')
  return ctx
}
