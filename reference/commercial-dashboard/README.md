# Engineering Standards

Two layers: the **Prickles canon** (general craft rules) and **project-specific
standards** (decisions particular to this codebase).

## 1. Prickles canon

We follow [Prickles](https://prickles.org) — 50 tenets across 9 pillars. The machine-
readable rules live in [`.claude/rules/`](../../.claude/rules/) and are loaded by the
agent every session; do not duplicate them here (**T4 · Schema Sovereignty** — one owner
per thing). The canonical human-readable source is prickles.org.

Pillars and the tenets we lean on most:

| Pillar | Rule file | Load it when… |
|---|---|---|
| Foundations | `prickles-foundations.md` | writing any code |
| Architecture | `prickles-architecture.md` | designing modules/folders, the API, data flow |
| Style | `prickles-style.md` | writing functions |
| Types & Schema | `prickles-types.md` | designing the DB schema, domain types, validators |
| Process | `prickles-process.md` | starting a unit of work (test-first, DoD) |
| Testing | `prickles-testing.md` | writing tests |
| AI Collaboration | `prickles-ai.md` | every task — plan/approve/execute/review |
| Tooling | `prickles-tooling.md` | setting up lint/format/duplication checks |
| Patterns | `prickles-patterns.md` | naming patterns, handling failure modes |

The install pack we downloaded is preserved at
[`prickles-pack-README.md`](prickles-pack-README.md) for provenance
(TypeScript / Claude Code bundle, v1.0).

## 2. Project-specific standards

These are decisions specific to this project. They are binding; where they add detail to a
Prickles tenet, the tenet still governs.

### Dependencies

- **No third-party service for a need the platform or standard library already covers.**
  Auth is a `users` table + Node's built-in `crypto`, not Clerk/Auth0/Supabase. Prefer
  zero new runtime dependencies; justify each one you add in the PR.
- Verify every external API/tier/price against live sources before relying on it
  (**AI5**). Training data is stale.

### Data & security

- Confidential data never reaches the client unprotected: nothing sensitive in `public/`,
  no secrets in the bundle, all data behind an authenticated API.
- **Secrets live in AWS Secrets Manager** (source of truth). Local dev uses an untracked
  `.env.local`. Nothing secret is committed. See the plan's Secrets section.
- Money is stored and computed as `numeric`/`decimal`, never floating point.

### Database

- Schema is normalised to **4NF** (project requirement). The relational store is the
  source of truth; the API composes the denormalised shapes the UI needs.
- Schema is owned as Drizzle code in the repo (**T4**); every change ships as a reviewed
  migration. No hand-editing of the live database.
- **[`database-changes.md`](database-changes.md) is binding for any schema change.** How the
  migrator actually decides what to run, the expand/contract rule, the checks and what each
  defends against, and how to baseline a database that has no ledger.

### Development

- **[`development.md`](development.md)** — from a fresh clone to a running local
  app, and from a local change to the live site. Setup, data, tests, deploy, troubleshooting.

### Agents

- **[`agent-guide.md`](agent-guide.md)** — how to work on this repository as an AI agent.
  Read it before a first change. Referenced from [`CLAUDE.md`](../../CLAUDE.md).

### Tooling

- Target lint/format config is [`eslint.config.mjs`](eslint.config.mjs) (the Prickles
  bundle: `typescript-eslint`, `sonarjs`, `unicorn`, `import`, `jscpd`, `prettier`). It is
  parked here until the TypeScript toolchain is installed, at which point it moves to the
  repo root and replaces the current `eslint.config.js`. Gate:
  `npx eslint . && npx jscpd src && npx prettier --check .`

### Process

- Short-lived branches, human + agent review before merge (**P7**).
- A change is done only when its checklist passes (**P3 · Definition of Done**): tests
  green against real dependencies, lint/format/duplication clean, docs updated.
