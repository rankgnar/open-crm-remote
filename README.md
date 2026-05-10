# open-crm-remote

> Admin mobile PWA for open-crm — manage clients, projects and schedule from the field.

Part of the [open-crm](https://github.com/rankgnar/open-crm) ecosystem. A mobile-first Progressive Web App for CRM administrators who need full access when away from their desk.

**Website:** [open-crm.org](https://open-crm.org)  
**License:** [MIT](LICENSE)

---

## Features

- Customer and project overview
- Create and edit project notes from the field
- Quotes (Förslag) — read-only with phases, labor, materials and totals
- Change orders (ÄTA) — create and manage from mobile
- Timeline (Tidplan) — project phase schedule
- Calendar — view and create team events
- Dark-first UI optimized for outdoor use

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript 5.7 |
| Build | Vite 6, `@tailwindcss/vite` |
| Styling | Tailwind CSS v4 |
| Data | Supabase (`@supabase/supabase-js`) |
| Hosting | Vercel |

---

## Getting started

```bash
git clone https://github.com/rankgnar/open-crm-remote.git
cd open-crm-remote
npm install
```

Copy `.env.example` to `.env`:

```
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

```bash
npm run dev       # http://localhost:5180
npm run build
npm run typecheck
```

---

## Security model

The app uses the Supabase `anon_key`. Access is controlled by the `app_admins` table — users not in that table are rejected at login. The `is_app_admin()` RLS function enforces this at the database level.

### Adding an admin user

1. Create the user in Supabase Auth
2. Insert a row into `app_admins`:

```sql
INSERT INTO public.app_admins (auth_user_id, email)
SELECT id, email FROM auth.users WHERE email = '<email>';
```

---

## License

[MIT](LICENSE)
