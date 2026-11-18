# ECRM Operations Hub — Agent Brief

> Persistent brief. Pointers, not snippets. Keep under ~200 lines.
> If something here is wrong, fix it in the same change that found the problem — every
> future session starts from this file, so an uncorrected error here repeats.

## What this is

A hub for running and planning the ECRM team's work, for Caroline. It should support:

- understanding current ECRM processes, owners and technology *(To confirm: which
  processes, tools and owners this hub is meant to cover)*
- tracking and planning **BAU**, **CEP**, **Deliverability** and **SCRAM** work
- managing actions, priorities, blockers, decisions and expected benefits across that work

As of 2026-11-18, this repository is **documentation and planning only** — no application
has been built here. *(To confirm: whether/when that changes, and what it would need to
cover.)*

## Standards (follow these)

- **Documentation and planning standards** — [`docs/standards/README.md`](docs/standards/README.md).
  Read it before writing or restructuring anything here.
- **Issue reporting** — [`.github/ISSUE_TEMPLATE/`](.github/ISSUE_TEMPLATE/): a bug report
  template and a work request template. Use them rather than raising work informally.
- Author drafts; a human (Caroline, unless told otherwise) approves before anything here
  counts as settled. This file and everything under `docs/` is a draft until approved.

## Hard constraints

- **Do not invent.** No owners, processes, dates, decisions or financial/benefit estimates
  that aren't already stated in this repo or given directly by Caroline. Write **"To
  confirm"** instead of a plausible-sounding guess.
- **Confidential by default.** ECRM operational data — performance, campaign, team and
  commercial detail — should be treated as confidential unless told otherwise. *(To
  confirm: specific handling rules, access restrictions, and anything required for personal
  data.)*
- **Plan → approve → execute → review.** For any non-trivial change: say what you're about
  to do and how it will be checked, get sign-off, make the change in a small reviewable
  step, then check the result against the plan before calling it done.

## How we work

- Short-lived branches; nothing merges to `main` without review.
- Verify, don't assume — if a fact isn't confirmed in this repo or by Caroline directly,
  mark it "To confirm" rather than inferring it from what seems likely.
- Keep documents practical and focused. Don't build application functionality as part of a
  documentation or planning change, and don't expand a doc's scope beyond what was asked.

## Reference material

[`reference/commercial-dashboard/`](reference/commercial-dashboard/) holds read-only
example material from another Little Star Media project. It's useful for *structure*
(how that project organised its docs and agent instructions) — not for *content*. None of
its forecasting detail, tech stack, hosting, database or deployment decisions apply to
ECRM. Don't edit it; don't copy it in as ECRM fact.

## Pointers

- Documentation & planning standards: [`docs/standards/README.md`](docs/standards/README.md)
- Report a bug or raise a work request: [`.github/ISSUE_TEMPLATE/`](.github/ISSUE_TEMPLATE/)
- Project overview: [`README.md`](README.md)
