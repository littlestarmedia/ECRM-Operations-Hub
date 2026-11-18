# Developing and deploying

From a fresh clone to a running local app, and from a local change to the live site.

Written against the code, not against intent. Where something is unbuilt or unverified it says
so. If a step here is wrong, fix it in the same pull request as whatever exposed it.

---

## 1. Prerequisites

**Node 22.13 or newer.** There is no `engines` field and no `.nvmrc`, so nothing enforces this —
the floor comes from the toolchain. Vite needs `^20.19.0 || >=22.12.0`; ESLint needs
`^20.19.0 || ^22.13.0 || >=24`. All three CI workflows pin Node 22, so that is what the project
is proven on.

```bash
node --version
npm ci
```

Use `npm ci`, not `npm install` — it is what CI runs, and it installs the exact lockfile.

---

## 2. The three things the repository cannot give you

A fresh clone gets you through `npm ci`, `npm run typecheck`, `npm run db:check` and
`npm run smoke`. Everything else needs three items from a colleague.

**A local Postgres.** There is no `docker-compose.yml`, no `Dockerfile` and no setup script in
this repository. `docs/plan/01-architecture-and-migration.md` mentions "Local Postgres via
Docker Compose" — that is a future work-package, not something that exists. Ask whoever set up
the last machine.

> **Ask for a local Postgres, not a Neon branch.** A remote branch will run `dev` and `import`,
> but `npm run test:e2e` refuses a non-local database, and a remote URL in `.env.local` puts
> `npm run import` one mistyped subdomain away from production. Where
> [`database-changes.md`](database-changes.md) and [`agent-guide.md`](agent-guide.md) suggest a
> Neon branch for local work, they predate the e2e guard. Follow this file.

**A `.env.local` in the repo root.** One variable matters:

```
DATABASE_URL=postgres://...your local database...
```

`SESSION_SECRET` is also in the existing file. No code currently reads it — sessions are random
32-byte tokens stored as SHA-256 hashes, with no signing key. Leave it alone rather than
deleting it, but do not go hunting for its value.

**The three source workbooks**, at `data/source/commercial-forecast.xlsx`,
`data/source/uk-ytd.xlsx` and `data/source/us-ytd.xlsx`. Gitignored and confidential.
`npm run import` reads these paths by constant and dies immediately without them.

---

## 3. Know what you are pointed at — before you write anything

This is the most important section in the document.

**`--env-file` does not override an exported shell variable.** Verified:

```bash
PROBE=from_shell node --env-file=probe.vars -e 'console.log(process.env.PROBE)'
# prints from_shell, not the file's value
```

So every command described as "reads `.env.local`" silently ignores it for any variable already
exported in that terminal. If you have ever typed `export DATABASE_URL=...`, or run
`DATABASE_URL_DIRECT=... npx tsx ...`, that value still wins.

**Before the first command that writes:**

```bash
env | grep -c '^DATABASE_URL'    # must print 0
node --env-file=.env.local -e "console.log(new URL(process.env.DATABASE_URL).hostname)"
```

The second command must print `localhost`, `127.0.0.1` or `::1`. Anything ending `.neon.tech`
means stop. Open a fresh terminal if in doubt.

**Which commands protect you, and which do not:**

| Command | Guard |
|---|---|
| `npm run test:e2e` | Refuses a non-local database |
| `npm run db:migrate:local` | Refuses a non-local database; prints its target |
| `npm run db:migrate` / `db:baseline` | Prints its target. No host guard — it is meant for CI |
| `npm run import` | Refuses while any hand-entered figure exists (unless `--delete-user-entries`). No host guard: deletes rows wherever it is pointed |
| `npm run seed` | **None.** Overwrites a user's password and role |
| `npm run dev` | **None.** Reads *and writes* whatever resolves |

**Never** run anything with `--env-file=.env.production`, and never copy `.env.production` to
`.env.local`. It holds live credentials. `agent-guide.md` says you will not be given production
credentials; on a machine that has been used to deploy, that file is sitting in the repo root,
so treat the danger as present rather than theoretical.

---

## 4. Setup, in order

```bash
npm run db:migrate:local   # create the schema
npm run import             # load the three workbooks
npm run seed               # create your login
```

**`db:migrate:local`** applies `db/migrations` and prints the host it connected to. It refuses a
non-local target.

**`import`** does more than fill dashboard tables — it creates the `months` rows, the
`forecast_settings` row the API assumes exists, and the `import_runs` row the e2e suite needs.
It verifies its own arithmetic and throws if the UK commission or YTD totals do not match.

> `import` is idempotent with respect to workbook data and **destructive with respect to human
> edits**. It deletes every `accounts` row, which cascades to `account_overrides` — every
> adjustment anyone has typed into the dashboard. Its "ALL CHECKS PASSED" message checks the
> workbook arithmetic, not which database it hit.

**`seed`** creates the user you log in as. Nothing else does; the whole app is behind a login.
The e2e suite does not need it — it creates its own account.

---

## 5. Running it

```bash
npm run dev     # http://localhost:5173
```

One Vite server serves the SPA and the API together. The API middleware is lazy — `server/serve.ts`
is not loaded until the first `/api/*` request, so a database misconfiguration shows up on first
use rather than at boot.

`npm run dev` is **not a sandbox**. It talks to whatever `DATABASE_URL` resolves to, and edits
made in the dashboard are written straight through. Never run it with `--host`: that puts
confidential commercial data on your local network.

`npm run preview` serves the built SPA but does not mount the API — the dev plugin only applies
in serve mode. Expect a login that cannot succeed. (Reasoned from the config, not run.)

---

## 6. Testing

```bash
npm run typecheck   # db, domain, ingest, api, lib, server, scripts — NOT src/
npm run db:check    # migration hygiene; no database, no credentials, runs anywhere
npm run test:e2e    # Playwright
npm run lint        # ~59 pre-existing errors; not a CI gate
```

`test:e2e` starts its own dev server, needs a migrated database with `import` already run, and
refuses to run against a non-local host. On a clean machine you will likely also need
`npx playwright install chromium` — nothing in the repo documents or automates this, so treat it
as probable rather than confirmed.

`npm run smoke -- <url>` probes every endpoint in the contract unauthenticated. It writes
nothing and is safe against production — the authenticated handlers reject before any database
access. It is the right first command when something looks broken.

Because `src/` is not typechecked, merge conflict markers in a `.jsx` file pass `typecheck` and
fail later at build.

---

## 7. Shipping

Cut a branch, open a PR. `typecheck` and `db:check` run on it. Lint, e2e and duplication do not.

Merging to `main` triggers [`vercel-deploy.yml`](../../.github/workflows/vercel-deploy.yml):

1. `npm ci`, `typecheck`
2. `vercel pull` — project config. Not credentials: Vercel marks database variables as
   sensitive, so their names arrive with empty values. The migrate step uses the
   `DATABASE_URL_DIRECT` repository secret instead.
3. **Apply database migrations** — additive only; destructive ones are refused
4. `vercel build`, then `vercel deploy --prebuilt --prod --skip-domain` — a private URL
5. `npm run smoke` against that URL
6. `vercel alias set` — **the point of no return**, the live domain moves here
7. `npm run smoke` against the live domain

There are **no preview deployments**. Vercel's Git integration is not producing builds; this
workflow is the only thing that ships.

`main` currently has no branch protection, so nothing stops a direct push. Don't.

**Rolling back code does not roll back the schema.** The migration commits at step 3, before the
domain moves at step 6, and nothing reverses it. Additive-only migrations are what make a
rollback safe at all — which is the whole reason destructive ones are quarantined in
[`contract-migration.yml`](../../.github/workflows/contract-migration.yml). See
[`database-changes.md`](database-changes.md).

---

## 8. Troubleshooting

**"Invalid email or password" — it usually isn't.** The login UI shows that string for *any*
failed response, and the login handler has no error handling, so a database problem arrives as a
500 and renders as a wrong-password message. Five different causes produce the identical screen:
no `.env.local`, Postgres not running, wrong `DATABASE_URL`, schema not migrated, or no user
seeded.

**Look at the terminal running `npm run dev`.** The real error is there. Then work down:

| Symptom | Check |
|---|---|
| Login says wrong password | The dev server terminal. Then `env \| grep -c '^DATABASE_URL'` |
| `ECONNREFUSED` | Postgres is not running |
| `relation "users" does not exist` | `npm run db:migrate:local` |
| Login correct but no data | `npm run import` |
| `ENOENT ... data/source/*.xlsx` | You do not have the workbooks |
| `node: .env.local: not found` | Create it |
| e2e refuses to start | It resolved a non-local database — check for an export |
| Deployed site broken | `npm run smoke -- https://forecast.lsmnetwork.com` first |

---

## 9. If you are an AI agent

Run freely: `npm run smoke`, `npm run typecheck`, `npm run db:check`, `npm run lint`.

**Do not run without the human confirming, in that same message, which database you are pointed
at:** `npm run import`, `npm run seed`, `npm run db:migrate`, `npm run db:migrate:local`,
`npm run db:baseline`, `vercel alias set`, `git push origin main`.

A failed command is recoverable. Those are not.

Before your first change, read [`agent-guide.md`](agent-guide.md).

---

## Known gaps

Recorded rather than hidden, so nobody rediscovers them the hard way:

- No local database provisioning in the repo. It is the first thing a newcomer is blocked on.
- `npm run import` and `npm run seed` have no host guard, unlike `test:e2e` and
  `db:migrate:local`. They are the two most destructive commands here.
- `src/` is outside `tsconfig` and outside the lint gate in practice.
- `npm run lint` has a standing error count, so it cannot be a gate until it is cleared.
- `src/App.jsx` still tells the user to create `public/data/commercial-forecast.xlsx` when data
  fails to load. That message is stale and instructs a confidentiality breach. Ignore it.
- The deploy pipeline's migrate step has never run against production.
