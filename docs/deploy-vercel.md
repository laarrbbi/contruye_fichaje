# Testing deploy on Vercel

One Vercel project serves everything from one address: the website (built from `web/`) and the
Laravel API (`api/`, run by the `vercel-php` runtime, PHP 8.4). The database is Postgres on Neon,
added from inside Vercel. Configuration: [`api/vercel.json`](../api/vercel.json) and the entry
file [`api/api/index.php`](../api/api/index.php).

This is a **test** deploy: demo accounts and the "simulated payment" button are on. Nothing here
charges a card.

## 1. Import the repository (about 3 minutes)

1. On [vercel.com](https://vercel.com) → **Add New… → Project** → import
   `laarrbbi/contruye_fichaje` (connect GitHub to Vercel if it asks).
2. On the configuration screen:
   - **Root Directory**: click *Edit* and choose **`api`**. This matters: Composer and the
     PHP function live there.
   - **Framework Preset**: *Other* (the build settings come from `api/vercel.json`; leave the
     build and output fields as they are).
3. Open **Environment Variables** and add these five before deploying:

| Name | Value |
|---|---|
| `APP_KEY` | a key starting with `base64:` (Claude gave you one; any `base64:` + 32 random bytes works) |
| `APP_ENV` | `staging` |
| `OPS_TOKEN` | a long random secret, 24 characters or more (Claude gave you one) |
| `DEMO_SEED` | `true` |
| `PAYMENTS_SIMULATE` | `true` |

4. Click **Deploy**. The first build takes 2–4 minutes. The site opens but cannot sign anyone in
   yet: it has no database.

## 2. Add the database (about 2 minutes)

1. In the project → **Storage** → **Create Database** → **Neon** (Serverless Postgres).
2. Region: **Frankfurt (eu-central-1)**, the closest to Spain and to the functions (`fra1`).
   Plan: **Free**.
3. **Connect** it to the project for *Production* and *Preview*. Vercel adds `DATABASE_URL`
   and related variables by itself; the app reads them.
4. **Deployments** → the latest one → **⋯ → Redeploy**, so the new variables apply.

## 3. Create the tables and the demo data (one visit)

Open, replacing the two parts in capitals:

```
https://YOUR-PROJECT.vercel.app/api/ops/setup?token=YOUR_OPS_TOKEN
```

It answers with the migrations, the demo seed and **OK** at the end. Visiting it again changes
nothing. To start over with fresh demo data, add `&reset=1` (refused in production).

A wrong or missing token answers *404 Not found*: the link does not exist for anyone else.

## 4. Test

Open `https://YOUR-PROJECT.vercel.app` and sign in (password `password` for all):

| E-mail | Account |
|---|---|
| `empresa@example.es` | company hiring workers |
| `trabajador@example.es` | worker |
| `cliente@example.es` | person who needs building work |
| `reformas@example.es` | building company |
| `admin@example.es` | admin |

Payments open the demo payment screen ("Simular pago correcto"). E-mails are not sent: they are
written to the logs (**Deployments → Logs**).

## How it works on Vercel

- Everything Laravel writes (cache files, compiled views) goes to `/tmp`; sessions and cache are
  in the database; logs go to Vercel's log view; e-mails and queued jobs run inside the request.
  All of it is set in `api/api/index.php`, and any variable set in the dashboard wins.
- Every Vercel address of the project (production and each preview) can sign in: Sanctum
  trusts the deploy's own hosts (`config/sanctum.php`).
- Every push to the production branch redeploys; other branches get preview addresses.
- The first request after a while is slower (the function starts cold). If that proves too slow
  for real use, the plan is to keep the website on Vercel and move the API to Laravel Cloud.

## Turning it into the real thing (later, not for testing)

`APP_ENV=production` (the demo seed and simulated payments then refuse to run),
`DEMO_SEED` and `PAYMENTS_SIMULATE` removed, Stripe keys (`STRIPE_SECRET`,
`STRIPE_WEBHOOK_SECRET`, webhook URL `https://your-domain/api/webhooks/stripe`), a mail
provider (`MAIL_*`), your domain, and a real admin (the setup link does not create one in
production; an `app:create-admin` path for Vercel comes with that phase).
