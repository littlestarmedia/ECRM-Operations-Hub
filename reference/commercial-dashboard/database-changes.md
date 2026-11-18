# Database changes

How the schema moves, and the rules that stop it moving badly. Binding, per
[`docs/standards/README.md`](README.md).

The database is owned by this repository (**T4 · Schema Sovereignty**). `db/schema.ts` is the
source of truth; the live database is downstream of it. Nobody edits the live schema by hand.

## The model

Four moving parts. Understand these and every rule below follows.

| Part | What it is |
|---|---|
| `db/schema.ts` | The schema, as code. The thing you edit. |
| `db/migrations/*.sql` | Generated SQL. One file per change. Never hand-written. |
| `db/migrations/meta/_journal.json` | The append-only ledger of what exists, in apply order. |
| `drizzle.__drizzle_migrations` | A table **in the database** recording what has been applied. |

`drizzle-kit generate` diffs `schema.ts` against the last snapshot and writes a `.sql` file, a
journal entry and a new snapshot. `npm run db:migrate` applies whatever the database has not
seen yet.

**How the migrator actually decides what to run** — this is the part that surprises people, and
every rule in this document exists because of it. From
`node_modules/drizzle-orm/pg-core/dialect.cjs`:

- it reads the **single highest** `created_at` from the ledger, **once**, before it starts;
- it then walks the journal **in array order**, applying every entry whose `when` is greater;
- it applies the whole batch inside **one transaction**, so a failure rolls all of it back;
- `idx` is **never read**. The filename number is for humans only.

Two consequences worth memorising. A `when` in the future permanently skips every migration
generated before that date. A journal whose `when` values do not strictly increase skips
entries **with no error at all** — the deploy goes green and the schema is wrong.

## Where migrations run

Production migrations run in CI, from `main`, and nowhere else — the
`Apply database migrations` step in
[`.github/workflows/vercel-deploy.yml`](../../.github/workflows/vercel-deploy.yml), between
`vercel pull` and `vercel build`.

That position is deliberate: nothing has been deployed yet, so a failure stops the job with the
live site untouched.

The credential comes from the `DATABASE_URL_DIRECT` repository secret — Neon's direct, unpooled
string. It cannot come from `vercel pull`: Vercel marks database variables as sensitive, so the
pulled env file carries their names with empty values.

It also creates the hazard that shapes everything else.

## Expand and contract

**The live domain keeps serving the previous deployment until the alias moves at the very end
of the deploy job.** So between the migrate step and the alias, the *old* code is running
against the *new* schema.

- **Expand** — `ADD COLUMN` (nullable or defaulted), `CREATE TABLE`, `CREATE INDEX`,
  backfills. The old code cannot see the new shape, so it carries on working. Safe to deploy
  automatically.
- **Contract** — `DROP COLUMN`, `DROP TABLE`, `DROP CONSTRAINT`, `SET NOT NULL`, changing a
  column type. The old code *is* using the thing you removed. Its queries start failing the
  moment the transaction commits, and re-deploying the old build cannot repair it, because
  `DROP COLUMN` does not un-drop.

So: **`npm run db:migrate` refuses to apply a destructive migration.** That refusal is not
advisory and there is no marker to opt out of it — forgetting a marker must never be able to
make a destructive migration look safe.

The order is always:

1. Ship the **expand** migration together with the code that starts using the new shape.
2. Backfill, and confirm the live site is healthy.
3. Ship the code that **stops** using the old shape. Confirm again.
4. Only now, run the **Contract migration** workflow
   ([`.github/workflows/contract-migration.yml`](../../.github/workflows/contract-migration.yml))
   to drop the old shape.

Steps 1 and 3 are separate pull requests. A single migration that both adds and removes is
rejected by `npm run db:check`; split it.

## Making a change

```bash
# 1. Edit db/schema.ts.
# 2. Generate the migration — never write the .sql by hand.
npx drizzle-kit generate

# 3. Read the generated SQL. Every line. It is the thing that will run against production.
# 4. Check it.
npm run db:check

# 5. Apply it to YOUR OWN database branch and test against it (TS4 — real dependencies).
npm run db:migrate:local
npm run test:e2e
```

Then open a PR. `db:check` and `typecheck` run on it automatically.

## User-entered data

`account_overrides`, `forecast_settings` and `seasonality_months` hold what people type into the
tool — Commission / Rev Share / Tenancy YTD, September Projection / Confirmed, run-rate
overrides, confidence, the growth rate, scenario amounts, seasonality. They exist nowhere else:
not in a workbook, a seed file or a migration. On 2026-09-16 four migrations reset columns in
those tables, correctly and on instruction, but with only a reviewer's eye between them and
production. That evening the business entered every Commission YTD figure by hand.

So, from migration `0016` onward, `npm run db:check` (and therefore the PR checks and the
deploy's migrate step) **refuses any migration that `UPDATE`s, `DELETE`s, `TRUNCATE`s or
`INSERT`s into those tables** unless the file carries a line naming the change and its approver:

```sql
-- user-data: zeroes Commission YTD so the team can re-enter it — approved by Caroline Sugrue on 2026-09-16
```

The marker is not a formality to paste in. Before adding it: take a Neon branch or a
`pg_dump`, say in the PR body exactly which figures change and why, and get the named person's
approval in writing. The check exists so the risk is written down before it can run, not to make
it easier to run.

`npm run import` is the other path that destroys these figures (it deletes every account, and
the cascade takes the overrides). It now refuses while any entry exists unless run with
`--delete-user-entries`.

## Things that are never acceptable

- **Editing `meta/_journal.json` by hand.** It carries the timestamps the migrator gates on.
  A hand-edited `when` has already reached a pull request on this project once, dated a day in
  the future, which would have silently skipped every migration generated before it.
- **Editing a snapshot in `meta/` by hand**, or a `.sql` file that has already been applied
  anywhere. Applied migrations are immutable; correct them with a new migration.
- **Renumbering a migration to resolve a collision.** `idx` is not what breaks. If two branches
  both generated `0003`, they share a snapshot `prevId`, and `drizzle-kit generate` refuses to
  run until that is repaired. Rebase the later branch onto the earlier one, delete its
  generated files, and run `npx drizzle-kit generate` again so it is built on the right parent.
- **`drizzle-kit push` against any shared database.** It applies DDL and writes no ledger row,
  which is how a database ends up needing the baseline procedure below.
- **Asking a human for the production connection string.** You do not need it, and you will not
  be given it. Work against your own branch; CI owns production.

## Baselining an existing database

If `npm run db:migrate` stops with *"This database has tables but no migration ledger"*, the
schema was applied with `drizzle-kit push` or by hand. Running the migrations now would replay
`0000_*.sql` — a `CREATE TABLE` — against tables that already exist, and the batch would roll
back.

Record the migrations that are already reflected in the database, without running them:

```bash
# Dry run first. It prints what it would record and changes nothing.
DATABASE_URL_DIRECT=... npx tsx scripts/baseline-migrations.ts --up-to=0002_crazy_captain_universe

# Only after you have checked the live schema really does match that migration:
DATABASE_URL_DIRECT=... npx tsx scripts/baseline-migrations.ts --up-to=0002_crazy_captain_universe --confirm
```

This is a human decision, not an agent's. A ledger row asserts *"this SQL is already reflected
in this database"*, and only a person looking at the actual schema can assert that honestly. If
you baseline past a migration that was never really applied, that DDL is skipped forever, with
no error.

## Backups

Neon's free tier gives a short instant-restore window and one manual snapshot. That is a rewind,
not a backup: a bad migration on a Friday is not recoverable on Monday.

Before any destructive migration, take a Neon branch — copy-on-write, near-instant, and it
persists until you delete it:

```bash
neonctl branches create --name pre-<migration-tag>
```

For anything you need to keep independently of Neon, take a `pg_dump` and store it outside the
repository. It is confidential per-operator commercial data; treat it accordingly.

> Verify Neon's current limits before relying on them (**AI5**). Tiers change, and the numbers
> in your training data are stale.

## Working against your own database

You never need production. Ask for a **local Postgres**, put its URL in your own untracked
`.env.local`, and you can break and reset it freely.

```bash
npm run db:migrate:local   # applies migrations; refuses a non-local host
npm run import             # reload from the source workbooks
npm run test:e2e           # also refuses a non-local host
```

Local, not a Neon branch. A remote URL works for `dev` and `import`, but `npm run test:e2e`
refuses it, and — more seriously — `npm run import` deletes rows wherever it is pointed, with no
guard and no host check. A Neon branch URL and the production URL differ by a subdomain.

Note that `--env-file` **loses to an exported shell variable**, so a `DATABASE_URL_DIRECT` you
exported earlier in the terminal beats `.env.local` silently. `db:migrate:local` prints the host
it resolved and refuses anything non-local; `import` and `seed` do neither. Check first:

```bash
env | grep -c '^DATABASE_URL'    # must print 0
```

Full setup instructions are in [`development.md`](development.md).

## The checks, and what each one defends against

`npm run db:check` ([`db/inspectMigrations.ts`](../../db/inspectMigrations.ts)) runs offline,
needs no credentials, and gates every pull request.

| Check | The failure it prevents |
|---|---|
| Every journal tag has a `.sql` file | A migration that cannot be read at apply time |
| Every `.sql` is in the journal | An orphan file that silently never runs |
| `idx` values are unique | Two branches generating the same number |
| Tags are unique | Two entries resolving to one file |
| `when` strictly increases | Entries skipped with no error |
| No `when` in the future | A poisoned high-water mark skipping everything before it |
| Snapshot `prevId`s are unique | Two migrations generated from the same parent; `generate` then refuses to run |
| No migration both adds and removes | An expand/contract pair that cannot deploy safely |
| A migration that writes to user-entered tables declares it | Figures people typed into the tool being reset by a migration nobody named as such (see "User-entered data") |

`npm run db:migrate` runs all of these again before it opens a connection, then refuses if a
pending migration is destructive or if the ledger needs baselining.
