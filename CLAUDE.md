# Construye Fichaje

Two separate construction platforms for Spain, in the CONSTRUYE design (sibling repository
`laarrbbi/contruye`): **Empleo** (workers ↔ companies hiring, the JobToday model) and **Obras**
(people ↔ companies doing building work, paid leads). Laravel 12 API + React 18 SPA. Spanish is
authored (`web/src/i18n/es.json`), English is a translation with the same keys.

## Rules that are not negotiable

- **The two platforms never mix.** One account = one role (`worker`, `employer`, `client`,
  `provider`, `admin`). Every signed-in API route sits behind `role:` middleware
  (`api/routes/api.php`); every page behind `ProtectedRoute roles={…}` (`web/src/App.tsx`).
- **The paywall is server-side.** What a locked worker or client exposes is decided only in
  `app/Support/Present.php` (+ `EmpleoAccess` for who is unlocked). Never send a full name,
  phone, e-mail or postal code of a locked party, and run free text through
  `Redact::contacts()`. The front end only displays what it is given.
- **Workers and private clients never pay.** Employers and providers do.
- **Prices live in `config/catalog.php` only** (cents, VAT included). They are starting values
  for the owner; never hardcode one elsewhere, front end included (it reads `/api/meta`).
- **Orders are delivered once** (`OrderFulfillment::markPaid`, row lock). Credits change only
  through `Credits::grant/spend`, which write the ledger in the same transaction.
- **Simulated payments never run in production** (`StripeService::simulationAllowed`).
- **Demo data never reaches production**: `DatabaseSeeder` refuses; companies are `[DEMO]`,
  addresses `@example.es`. A live admin comes from `php artisan app:create-admin`.
- **Design**: reuse the CONSTRUYE tokens and pieces (`index.css`: `titre`, `etiquette`,
  `btn-or`, `lien-edito`, `verre`, `plan-grille`, `theme-night`; `components/ui`). No new
  palette, no new typeface.

## Running it

| Task | Command |
|---|---|
| Tests (SQLite in memory) | `cd api && php artisan test` (or `make test` in Docker) |
| PHP style | `cd api && ./vendor/bin/pint` |
| Front end | `npm --prefix web run lint` · `npm --prefix web run build` (runs `tsc -b`) |
| Dev servers | `php artisan serve --port=8000` + `npm --prefix web run dev`, open http://localhost:5174 |
| Demo data | `php artisan migrate:fresh --seed` (accounts in README, password `password`) |

## Deploys

- **Vercel (testing)**: one project, Root Directory `api`, config in `api/vercel.json`, entry
  `api/api/index.php` (vercel-php runtime, PHP 8.4). The deploy's files are read-only: anything
  Laravel writes must go to `/tmp` or the database (the entry file sets this). Postgres comes
  from Neon (`DATABASE_URL`). Steps: `docs/deploy-vercel.md`.
- **Postgres and MySQL both supported**: CI runs the suite on both. Keep queries portable.
- `GET /api/ops/setup?token=…` (`OpsController`) migrates a deploy that cannot run artisan, and
  seeds the demo on test deploys. Off without `OPS_TOKEN`; demo never in production.

## Shape of the code

- `api/app/Http/Controllers/Api/Empleo/` — `JobController` (public board), `WorkerController`
  (profile, one-tap apply), `EmployerController` (offers, applicants, open chat),
  `DirectoryController` (workers' directory, contact credits).
- `api/app/Http/Controllers/Api/Obras/` — `ClientController` (requests), `ProviderController`
  (leads, unlock with credits), `CompanyDirectoryController` (public list, no contacts).
- `ConversationController` — chats exist only once the paying side opened them
  (`Services\Chat::open`), one per (opener, member, platform). Polled by the SPA, not pushed.
- `BillingController` + `WebhookController` + `Services\StripeService` — checkout, webhook
  (signature, amount, currency, session all checked), simulated payments.
- `Admin\AdminController` — figures, accounts (block, gift credits), orders, offers, requests.
- `web/src/api/*.ts` — one TanStack Query hook per endpoint. `web/src/components/Paywall.tsx`
  — plan cards, the buy flow, the "no credits left" dialog, blurred locked values.
- Translations: `t()` keys must exist in both `es.json` and `en.json` (same key set).
