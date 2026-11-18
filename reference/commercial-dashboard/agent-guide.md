# Working on this repository as an AI agent

Read this before your first change. [`CLAUDE.md`](../../CLAUDE.md) is the short brief; this is
the detail behind it.

The rules here are not general advice. Each one is written down because it has already gone
wrong on this project, in a way that reached production or nearly did.

## The loop

Plan → approve → execute → review (**AI1 · The Intern Pattern**). Not optional, and not
satisfied by describing what you are about to do in the same message as doing it.

- **Plan.** Name the files you will touch, the decision you are making, and how it will be
  verified. If the work involves the database schema, read
  [`database-changes.md`](database-changes.md) first — it will change your plan.
- **Approve.** A human signs off. No edits before that.
- **Execute** in small units, on a short-lived branch (**P7**). `main` is always shippable.
- **Review.** Grade your own work against the brief and the tests before handing it back
  (**AI6**), then a human reviews. Both gates close before merge.

Write the acceptance criteria so a machine can grade them (**AI4**). "Works correctly" is not
a criterion. "`npm run db:check` exits 0 on a branch containing two migrations generated from
the same parent" is.

## Before you believe anything

**Verify against the artefact, not the description** (**AI5**). Three specific habits:

- **Read the file, don't infer the behaviour.** This project spent two days blocked because
  everyone believed the deploy pipeline ran database migrations. It never had. The belief came
  from a planning document written in the present tense.
- **A document in `docs/plan/` may describe intent, not reality.** Check `docs/plan/` against
  the code before relying on it. If you find a line that describes something unbuilt as though
  it exists, fix the line as part of your change.
- **Check the installed source and live docs, never your training.** Library APIs, platform
  behaviour, pricing and free-tier limits all move. `node_modules/` is on disk; read it. For
  anything external, fetch the current documentation.

## Green does not mean working

The tests in this repository have been green while the product was broken, more than once.

- The e2e suite passes against the Vite dev server, which routes through `server/routes.ts`.
  Vercel routes by filename. Three API routes 404'd on the live site for the entire life of a
  deployment while every test stayed green. `npm run smoke` exists because of that.
- `npm run smoke` sends **no credentials**, so every authenticated route stops at its `401`
  before touching the database. It proves a route is deployed. It proves nothing about whether
  that route can read the schema. A schema mismatch passes it.
- `npm run typecheck` covers `db`, `domain`, `ingest`, `api`, `lib`, `server` and `scripts`.
  It does **not** cover `src/`. Merge conflict markers in a `.jsx` file survive it.
- `npm run lint` currently reports 59 pre-existing errors on `main`. It is not yet a CI gate
  for that reason. Do not add to the count; fixing some of it is a welcome separate commit
  (**P6 — tidy the file you opened**, in its own commit).

So: after a change that touches data, say plainly which of these you ran, and what each one
does and does not prove. Do not report "tests pass" as though it means the feature works.

## Things this repository will let you do wrong

- **GitHub reporting a PR "mergeable / clean" means nothing about other open PRs.**
  Mergeability is computed against `main`, never against another branch. Two branches here
  each generated a migration numbered `0003` and both reported clean.
- **`db/schema.ts` auto-merges.** Two conflicting schema changes can merge into a clean union
  that typechecks perfectly and describes a database that does not exist.
- **Nothing deploys except a push to `main`.** The Vercel Git integration is not producing
  builds for this project; the GitHub Actions workflow is the only thing that ships. A preview
  URL you expect to exist probably does not.

## Credentials

You should not ask for production credentials. If you find yourself writing a message that asks
a human for a connection string, stop — that is the signal you have taken a wrong turn, not a
blocker to escalate.

Do not assume they are absent, either. On a machine that has been used to deploy, an
`.env.production` holding live credentials sits in the repo root. Treat the danger as present:
never run a script with `--env-file=.env.production`, and check what `DATABASE_URL` actually
resolves to before any command that writes — an exported shell variable beats `--env-file`.

- Production migrations run in CI from `main`. That is the only writer to the production schema
  (**T4**).
- For local work, ask for **a local Postgres**. Its URL goes in an untracked `.env.local` and
  you can break it freely. Not a Neon branch: `npm run test:e2e` refuses a non-local host, and
  `npm run import` deletes rows wherever it is pointed, with no guard.
- Setup, and the commands that are and are not protected:
  [`development.md`](development.md).
- Secrets live in AWS Secrets Manager. Nothing secret is committed, and nothing secret is
  printed into a transcript, a log or a pull request — including by a diagnostic command you
  ran for another reason.
- Never inline a secret into the client bundle. Anything prefixed `VITE_` is compiled into
  JavaScript the browser downloads. This has been got wrong here once already.

## The data is confidential

Per-operator budgets, commission, named account managers, relationship notes. Senior management
is the audience.

- Never put a spreadsheet in `public/`.
- Never write business data into a document, a test fixture, or a commit message.
- When reading the database to answer a question, query `information_schema` and the migration
  ledger. Do not select rows from business tables to satisfy your own curiosity.

## Writing the code

The [Prickles canon](../../.claude/rules/) is authoritative; read the relevant pillar before
you start. In practice, on this codebase:

- New code is TypeScript, `strict`. No `any`, no `as` casts other than `as const`, no
  `@ts-ignore` (**T2**). Parse unknown data with a type guard at the boundary and trust the
  type afterwards (**T3**).
- Small functions, guard clauses, at most three parameters (**S2**, **S3**, **S4**).
- Comments explain *why*, never *what*. If you are about to write a comment explaining what the
  code does, rename something instead (**F5**). The existing comments in
  `scripts/smoke-routes.ts` and `.github/workflows/vercel-deploy.yml` are the house style:
  they record the incident that motivated the line.
- Tests first, against real dependencies — a real Neon branch, not mocks (**P1**, **TS4**).
- Name a test for the behaviour, not the method (**TS1**).

## Before you open a pull request

Run these, and say in the PR body what each one proved:

```bash
npm run typecheck     # note: does not cover src/
npm run db:check      # migration hygiene; offline, no credentials
npm run test:e2e      # against your own database branch
```

Then check yourself against this list:

- [ ] The change is on a branch, not `main`.
- [ ] A human approved the plan before I started editing.
- [ ] If I touched `db/schema.ts`: the migration is generated, not hand-written, and I have read
      the generated SQL line by line.
- [ ] If the migration writes to `account_overrides`, `forecast_settings` or `seasonality_months`:
      it carries the `-- user-data: … approved by … on …` line, a named person really approved it,
      and the PR body says which figures change (see `database-changes.md`, "User-entered data").
- [ ] If the migration removes or narrows anything: it is in its **own** pull request, separate
      from the code change, and I have said so in the PR body.
- [ ] I did not edit `_journal.json`, a snapshot, or an applied `.sql` file.
- [ ] I have not asked anyone for a production credential.
- [ ] Any claim I make about the pipeline, a library or a platform limit, I verified today
      against the file or the live documentation — not from memory.
- [ ] I have stated what my testing does **not** cover.

## If something here is wrong

Fix it in the same pull request. This file and [`CLAUDE.md`](../../CLAUDE.md) are code
(**AI2**): if they are wrong on `main`, every future session starts wrong. That is exactly how
the migration misunderstanding lasted as long as it did.
