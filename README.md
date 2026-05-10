# open-crm-remote

Mobile-first PWA för adminåtkomst till CRM:et från fältet. Syskonprojekt
till `open-crm` (Electron-desktopen) och `open-crm-app` (anställdas tid- och
ledighetsapp). Den här appen är **bara för admin** och täcker det jag behöver
göra när jag inte är på kontoret: titta på kunder/projekt/förslag/tidplan,
anteckna i projekt, skapa ÄTA direkt på arbetsplatsen, se och skapa
kalenderhändelser.

---

## Stack

| Lager | Teknik |
|---|---|
| Frontend | React 18 + TypeScript 5.7 |
| Build | Vite 6 + `@tailwindcss/vite` |
| UI | Tailwind v4 (`@theme` tokens, samma palett som `open-crm-app`) + lucide-react |
| Data | Supabase, `@supabase/supabase-js` med `anon_key` |
| Hosting | Vercel |

Inget eget backend. All åtkomst går direkt från klienten till Supabase
med `anon_key`. Adminbehörighet styrs via tabellen `app_admins` och
RLS-funktionen `is_app_admin()`.

## Modulscope

| Modul | Behörighet |
|---|---|
| Kunder | Läsa lista + detalj (med projekten) |
| Projekt | Läsa lista + detalj med flikar (Info, Anteckningar, Förslag, ÄTA, Tidplan) |
| Anteckningar | **Skapa, redigera, radera** — det här är huvudfunktionen i fält |
| Förslag | Endast läsning (faser, subfaser, totaler) |
| Tidplan | Endast läsning (förslagets faser med datum) |
| ÄTA | Lista + detalj + **skapa nytt med rader** (ingen signering från mobilen) |
| Kalender | Lista nästa 60 dagar + **skapa, redigera, radera** händelser |

Avsiktligt utanför scope: redigera kunder/projekt, skapa förslag, signera,
ekonomi, fakturor, personal, workflows, e-post, Fortnox/Zoho.

## Lokal utveckling

```bash
npm install
npm run dev          # http://localhost:5180  (även exponerad på nätet för mobil-test)
npm run build
npm run typecheck
npm run preview
```

Behöver `.env` (kopiera `.env.example`):

```
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

## Deployment

Vercel-projektet är redan länkat (`.vercel/project.json` finns lokalt).

```bash
vercel deploy --prod
vercel deploy           # preview-URL (för mobiltest av en förändring)
vercel logs <url>       # logs vid problem
vercel env ls           # lista env-vars i Vercel
```

Env-vars som finns i Vercel (production): `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`.

## Adminregistrering

För att en ny person ska kunna logga in:

1. **Supabase Studio → Authentication → Add user** med personens e-post,
   lösenord, "Auto Confirm User".
2. **SQL Editor**:

   ```sql
   INSERT INTO public.app_admins (auth_user_id, email)
   SELECT id, email FROM auth.users WHERE email = '<emailen>';
   ```

3. Verifiera: `SELECT * FROM public.app_admins;`

Användare som inte finns i `app_admins` får `Åtkomst nekad` på inloggning.

## Filstruktur

```
src/
├── App.tsx                   # auth gate + view router (state-based)
├── main.tsx
├── style.css                 # Tailwind v4 @theme — samma tokens som open-crm-app
├── lib/
│   ├── supabase.ts          # supabase-js singleton (anon_key)
│   ├── theme.tsx            # dark/light + localStorage
│   ├── format.ts            # Intl-baserade fmt-helpers (sv-SE)
│   ├── types.ts             # entitetsgränssnitt
│   └── navigation.tsx       # NavigationProvider — stack per tab
├── hooks/
│   └── useAuth.ts           # Supabase Auth + verifierar mot app_admins
├── components/
│   ├── BottomNav.tsx        # 5 ikoner: Kunder, Projekt, ÄTA, Kalender, Mer
│   ├── TopBar.tsx
│   ├── ListRow.tsx
│   ├── EmptyState.tsx
│   └── Loading.tsx
└── pages/                    # 15 sidor — en per vy
```

Designsystem: dark theme som default, `@theme`-tokens (`bg`, `surface`,
`elevated`, `border`, `hover`, `fg`, `muted`, `subtle`), tap targets ≥ 44px,
safe-area-padding för iPhone-notch.

## Säkerhetsmodell

- Klienten kör med `anon_key` (publik) — utan adminroll i `app_admins`
  ger RLS noll åtkomst till kunder/projekt/forslag/ata.
- `is_app_admin()` är `SECURITY DEFINER STABLE` — slår en lookup mot
  `app_admins` och cachar inom samma transaktion.
- Electron-desktopen (`open-crm`) kör med `service_role` och bypassar RLS
  helt — opåverkad av tabellerna här.
- Migration som installerar tabell, funktion, policys och `GRANT`s:
  `open-crm/supabase/migrations/20260428120000_create_app_admins_and_remote_rls.sql`

## TODO / nästa steg

- Service worker för offline-läsning av cachade listor (avstängt i MVP).
- Riktiga PNG-ikoner istället för SVG-platshållaren (`public/icon.svg`).
- Push-notiser för kommande kalenderhändelser (kräver eget Edge Function).
