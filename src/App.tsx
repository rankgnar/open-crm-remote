import { TopBar } from './components/TopBar'
import { BottomNav } from './components/BottomNav'
import { MoreMenu } from './components/MoreMenu'
import { Loading } from './components/Loading'
import { LoginPage } from './pages/LoginPage'
import { AccessDeniedPage } from './pages/AccessDeniedPage'
import { KunderListPage } from './pages/KunderListPage'
import { KundDetailPage } from './pages/KundDetailPage'
import { ProjektListPage } from './pages/ProjektListPage'
import { ProjektDetailPage } from './pages/ProjektDetailPage'
import { ProjektInfoPage } from './pages/ProjektInfoPage'
import { ProjektAnteckningarPage } from './pages/ProjektAnteckningarPage'
import { ProjektForslagPage } from './pages/ProjektForslagPage'
import { ProjektAtaPage } from './pages/ProjektAtaPage'
import { ProjektDokumentPage } from './pages/ProjektDokumentPage'
import { AnteckningEditPage } from './pages/AnteckningEditPage'
import { ForslagDetailPage } from './pages/ForslagDetailPage'
import { TidplanDetailPage } from './pages/TidplanDetailPage'
import { AtaDetailPage } from './pages/AtaDetailPage'
import { AtaCreatePage } from './pages/AtaCreatePage'
import { AtaSignPage } from './pages/AtaSignPage'
import { KalenderListPage } from './pages/KalenderListPage'
import { KalenderDetailPage } from './pages/KalenderDetailPage'
import { KalenderEditPage } from './pages/KalenderEditPage'
import { RevisorPage } from './pages/RevisorPage'
import { KvittoListPage } from './pages/KvittoListPage'
import { KvittoCreatePage } from './pages/KvittoCreatePage'
import { ChatListPage } from './pages/ChatListPage'
import { ChatThreadPage } from './pages/ChatThreadPage'
import { useAuth } from './hooks/useAuth'
import { NavigationProvider, useNav, type View } from './lib/navigation'
import { useBrandingInjector } from './lib/branding'

export function App() {
  useBrandingInjector()
  const { user, isAdmin, loading, error, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg safe-top safe-bottom">
        <Loading label="Verifierar…" />
      </div>
    )
  }

  if (!user) return <LoginPage />

  if (!isAdmin || error === 'forbidden') {
    return <AccessDeniedPage email={user.email} onSignOut={signOut} />
  }

  if (error === 'unknown') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-8 text-center bg-bg safe-top safe-bottom">
        <p className="text-sm text-muted">Kunde inte verifiera adminbehörighet. Kontrollera nätverket.</p>
        <button className="btn btn-ghost" onClick={signOut}>Logga ut</button>
      </div>
    )
  }

  return (
    <NavigationProvider>
      <Shell email={user.email} onSignOut={signOut} />
    </NavigationProvider>
  )
}

interface ShellProps {
  email: string | undefined | null
  onSignOut: () => void
}

function Shell({ email, onSignOut }: ShellProps) {
  const nav = useNav()

  return (
    <div className="flex flex-col h-full bg-bg text-fg">
      <TopBar
        title={titleFor(nav.current)}
        onBack={nav.canGoBack ? nav.pop : undefined}
        right={<MoreMenu email={email} onSignOut={onSignOut} />}
      />

      <main className="flex-1 overflow-auto">
        <ViewRenderer view={nav.current} />
      </main>

      <BottomNav active={nav.tab} onChange={nav.setTab} />
    </div>
  )
}

function titleFor(view: View): string {
  switch (view.kind) {
    case 'kunder.list':              return 'Kunder'
    case 'kund.detail':               return 'Kund'
    case 'projekt.list':              return 'Projekt'
    case 'projekt.detail':            return 'Projekt'
    case 'projekt.info':              return 'Info'
    case 'projekt.anteckningar':      return 'Anteckningar'
    case 'projekt.anteckning.edit':   return view.anteckningId ? 'Redigera anteckning' : 'Ny anteckning'
    case 'projekt.forslag':           return 'Förslag'
    case 'projekt.ata':               return 'ÄTA'
    case 'projekt.dokument':          return 'Dokument'
    case 'forslag.detail':            return 'Förslag'
    case 'tidplan.detail':            return 'Tidplan'
    case 'ata.detail':                return 'ÄTA'
    case 'ata.create':                return 'Ny ÄTA'
    case 'ata.sign':                  return 'Signera ÄTA'
    case 'kalender.list':             return 'Kalender'
    case 'kalender.detail':           return 'Händelse'
    case 'kalender.edit':             return view.id ? 'Redigera händelse' : 'Ny händelse'
    case 'revisor':                   return 'Revisor'
    case 'kvitto.list':               return 'Kvitto'
    case 'kvitto.create':             return 'Nytt kvitto'
    case 'chat.list':                 return 'Chat'
    case 'chat.thread':               return view.namn
  }
}

interface ViewRendererProps {
  view: View
}

function ViewRenderer({ view }: ViewRendererProps) {
  switch (view.kind) {
    case 'kunder.list':              return <KunderListPage />
    case 'kund.detail':               return <KundDetailPage id={view.id} />
    case 'projekt.list':              return <ProjektListPage />
    case 'projekt.detail':            return <ProjektDetailPage id={view.id} />
    case 'projekt.info':              return <ProjektInfoPage projektId={view.projektId} />
    case 'projekt.anteckningar':      return <ProjektAnteckningarPage projektId={view.projektId} />
    case 'projekt.anteckning.edit':   return <AnteckningEditPage projektId={view.projektId} anteckningId={view.anteckningId} />
    case 'projekt.forslag':           return <ProjektForslagPage projektId={view.projektId} />
    case 'projekt.ata':               return <ProjektAtaPage projektId={view.projektId} />
    case 'projekt.dokument':          return <ProjektDokumentPage projektId={view.projektId} />
    case 'forslag.detail':            return <ForslagDetailPage forslagId={view.forslagId} />
    case 'tidplan.detail':            return <TidplanDetailPage forslagId={view.forslagId} />
    case 'ata.detail':                return <AtaDetailPage id={view.id} />
    case 'ata.create':                return <AtaCreatePage projektId={view.projektId} />
    case 'ata.sign':                  return <AtaSignPage id={view.id} />
    case 'kalender.list':             return <KalenderListPage />
    case 'kalender.detail':           return <KalenderDetailPage id={view.id} />
    case 'kalender.edit':             return <KalenderEditPage id={view.id} defaultProjektId={view.defaultProjektId} />
    case 'revisor':                   return <RevisorPage />
    case 'kvitto.list':               return <KvittoListPage />
    case 'kvitto.create':             return <KvittoCreatePage />
    case 'chat.list':                 return <ChatListPage />
    case 'chat.thread':               return <ChatThreadPage personalId={view.personalId} />
  }
}
