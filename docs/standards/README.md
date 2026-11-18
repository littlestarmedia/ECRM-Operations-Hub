# Documentation and Planning Standards

How documents and plans are written and kept in this repository. Binding for anyone —
human or agent — adding to this hub. Referenced from [`CLAUDE.md`](../../CLAUDE.md).

## Writing documentation here

- **Keep it short and pointer-based.** Say where the detail lives rather than restating
  it in two places — one source of truth per fact.
- **Mark the unconfirmed.** Any owner, process detail, date, decision or benefit estimate
  that isn't already settled in this repo or confirmed directly by Caroline gets written
  as **"To confirm"** — not a best guess, not an inferred value.
- **Date and own what matters.** When a decision or process description is confirmed,
  record when and by whom, so later readers know whether it's still current.
- **Treat docs as code.** If a document turns out wrong, fix it in the same change that
  exposed the problem, not as a follow-up.
- **Don't build the application here.** This hub is documentation and planning; a change
  to it shouldn't quietly grow into implementation work.

## Planning work: BAU, CEP, Deliverability, SCRAM

These are the categories of ECRM work this hub tracks. *(To confirm: precise scope and
definition of each — recorded here only once Caroline confirms them.)*

For each piece of planned or in-flight work, capture:

| Field | What it captures |
|---|---|
| Area | BAU / CEP / Deliverability / SCRAM / Other |
| Owner | Who's driving it — "To confirm" if not yet assigned |
| Status | e.g. Not started / In progress / Blocked / Done |
| Priority | Relative priority — "To confirm" until a scale is agreed |
| Blockers | What's stopping progress, and what/who resolves it |
| Decision needed | What has to be decided, and by whom, before this can move |
| Expected benefit | Why it matters — "To confirm" until it's actually estimated or agreed |

Keep one current record per piece of work rather than letting status live only in
conversation — that's what makes blockers, decisions and priorities visible across BAU,
CEP, Deliverability and SCRAM at a glance.

## Reporting issues and work

Use the templates in [`.github/ISSUE_TEMPLATE/`](../../.github/ISSUE_TEMPLATE/):

- **Bug report** — something in an ECRM process, tool, report or document isn't working
  as expected.
- **Work request** — new work to plan in, or a change to work already planned, against
  the fields above.

## Keeping this current

This file and [`CLAUDE.md`](../../CLAUDE.md) are the standards for this hub. If either is
wrong or out of date, correct it in the same change that found the problem — not a
separate task for later.
