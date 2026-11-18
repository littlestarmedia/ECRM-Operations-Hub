# Commercial Forecast Dashboard — Agent Brief

> Persistent brief (Prickles **AI2**). Pointers, not snippets. Keep under ~200 lines.
> If something here is wrong on `main`, every session is wrong — treat this file as code.

## What this is

An internal FY26/27 commercial revenue & commission forecast dashboard for Little Star
Media, for senior-management review. Confidential data (per-operator budgets, commission,
named account managers, relationship notes). Small user base.

Today it is a Vite + React SPA that reads Excel files in the browser. We are migrating it
to a proper hosted app with a database, real auth, and a deploy pipeline. See
[`docs/plan/`](docs/plan/).

## Standards (follow these)

- **Prickles canon** — the rules in [`.claude/rules/`](.claude/rules/) are authoritative.
  Read the relevant pillar before working (Types & Schema for the DB, AI Collaboration for
  process, Testing for tests). Canonical source: https://prickles.org
- **Project standards** — [`docs/standards/`](docs/standards/).
- Author drafts, human approves and edits last (**AI6**). This file and every doc/schema
  under `docs/` is a draft until a human signs off (**AI1**).

## Locked decisions

| Area | Decision |
|---|---|
| Hosting | Vercel (`forecast.lsmnetwork.com`, already pointed at Vercel) |
| Database | Neon Postgres, **free tier** |
| ORM | **Drizzle** — schema-as-code in the repo (**T4 Schema Sovereignty**) |
| Language | **TypeScript strict** for all new code (**T1/T2**); React app migrated incrementally |
| Schema | Normalised to **4NF** — see [`docs/plan/02-schema-4nf.md`](docs/plan/02-schema-4nf.md) |
| Auth | Own `users` table in Neon; password hashing via Node built-in `crypto` (scrypt); server-side session cookies. **No third-party auth service.** |
| Secrets | **AWS Secrets Manager** is the source of truth. Never commit secrets. |

## Hard constraints (non-negotiable)

- **No third-party service dependencies for simple needs.** No Clerk/Auth0/Supabase-auth
  etc. If the standard library or Postgres can do it, use those.
- **Verify before you build** (**AI5**) — check live docs/source, don't rely on training.
  Pricing, tiers, and APIs change; confirm them.
- **Confidential data never ships to the client unprotected.** No spreadsheets in `public/`,
  no secrets inlined into the bundle (the old `VITE_DASHBOARD_PASSWORD`/`LSM123` gate was
  exactly this mistake — being removed).
- **Plan → approve → execute → review** (**AI1**). No code before an approved plan.

## How we work

- Short-lived branches, reviewed before merge (**P7**).
- Tests are the brief; write them first (**P1**), test against real dependencies — a real
  Postgres/Neon branch, not mocks (**TS4**).
- Local dev must run and pass fully before anything is pushed. See the plan.

## Pointers

- **Working here as an agent — read first:** [`docs/standards/agent-guide.md`](docs/standards/agent-guide.md)
- **Setup, running locally, testing, deploying:** [`docs/standards/development.md`](docs/standards/development.md).
  `--env-file` loses to exported shell variables; `import` and `seed` delete rows with no host
  guard. Confirm what `DATABASE_URL` resolves to before any command that writes.
- **Any schema change:** [`docs/standards/database-changes.md`](docs/standards/database-changes.md).
  Migrations are generated, never hand-written; they run in CI from `main` and nowhere else;
  destructive ones ship separately from the code change. Never ask for a production connection string.
- Plan & roadmap: [`docs/plan/01-architecture-and-migration.md`](docs/plan/01-architecture-and-migration.md)
  — a target, not a description; check the code before relying on it.
- 4NF schema: [`docs/plan/02-schema-4nf.md`](docs/plan/02-schema-4nf.md)
- Standards: [`docs/standards/README.md`](docs/standards/README.md)
- Current data shape lives in the parsers being replaced: `src/utils/parseWorkbook.js`, `src/utils/parseYTD.js`.
