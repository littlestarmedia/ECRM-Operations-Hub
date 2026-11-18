# ECRM Operations Hub

A working hub for running and planning the ECRM team's work: understanding current ECRM
processes, owners and technology, and tracking BAU, CEP, Deliverability and SCRAM work —
actions, priorities, blockers, decisions and expected benefits.

**Status:** a working MVP exists (see below) on the `ecrm-planning-tool` branch — not deployed,
not yet connected to a shared/hosted database, not yet merged to `main`.

## What's here

- [`CLAUDE.md`](CLAUDE.md) — the brief an AI agent reads before doing anything in this repo.
- [`docs/standards/`](docs/standards/) — how documentation and planning work here.
- [`.github/ISSUE_TEMPLATE/`](.github/ISSUE_TEMPLATE/) — report a bug or raise a work request.
- [`reference/`](reference/) — read-only example material from another Little Star Media
  project (Commercial Forecast Dashboard), kept for its documentation/process structure only.
  Not specific to ECRM; do not treat its content, tech choices or decisions as ECRM's.
- `server/`, `db/`, `scripts/`, `public/` — the planning tool application (see below).

## The planning tool

A working app for Caroline to run and plan ECRM team work: a team overview, an editable
work-item board, the end-to-end process map (SCRAM MVP position first), upcoming
BAU/CEP/Deliverability/SCRAM/commercial-improvement work, team meetings, and a concise
view for Rob. Seeded from the existing ECRM operating-view material rather than invented;
anything not in that material is marked "To confirm".

### Running it locally

```bash
npm install
cp .env.example .env            # edit DATABASE_URL to point at your own local Postgres
npm run migrate                 # creates the schema
npm run seed                    # loads the existing ECRM work items and decisions (once)
npm run create-user             # creates your sign-in — prompts for a password
npm start                       # http://localhost:3000
```

There is no self-serve sign-up and no automated password reset in this MVP (see "What's not
built yet"). Run `npm run create-user` again with the same email to reset a password.

### Shared storage and sign-in — how it's implemented

- **Storage:** Postgres, via a thin hand-written data-access layer (`server/db.js`, plain SQL
  in `db/schema.sql`) — no ORM, no vendor lock-in. All work-item and decision data is read
  from and written to this database; the browser holds nothing but a session cookie.
  Browser storage (`localStorage`/`sessionStorage`) is not used for data — per-view UI state
  only would ever go there, and today nothing does.
- **Sign-in:** email + password. Passwords are hashed with Node's built-in `crypto.scrypt`
  (salted, never stored or logged as plain text). A session is a random 32-byte token; only
  its SHA-256 hash is stored server-side, in a `sessions` table, with an expiry. The browser
  gets an `HttpOnly`, `SameSite=Lax` cookie — not a JWT, not readable by page JavaScript.
  Every `/api/*` route except `/api/login` requires a valid session.
- **Verified, not just built:** this was run end-to-end against a real local Postgres
  instance — migration, seed, account creation, sign-in, the 401 gate on every API route
  when signed out, create/update/delete/drag-drop on work items, and sign-out — before being
  called done. It has **not** been connected to a shared/hosted database reachable by more
  than one machine, and has **not** been deployed anywhere.

### What's not built yet / needs a decision

- **Where this runs and which Postgres instance is "the" shared one.** Nobody has chosen a
  host or provisioned a shared database yet — *To confirm*. Whoever does should set
  `DATABASE_URL` there to that instance and run `npm run migrate` once.
- **Account creation and password reset beyond the admin script.** There's no email-sending
  infrastructure confirmed to exist, so this MVP deliberately keeps account management to
  `npm run create-user`, run by whoever administers the tool. Self-serve reset needs that
  infrastructure — *To confirm* whether/when it exists.
- **The process map, ownership table, Danny's breakdown and team-meetings content are static
  reference data** (`public/data.js`), not editable through the UI — only the work-item board
  and decisions are. Editing that reference content means a code change for now.
- **HTTPS/`Secure` cookies**: the session cookie is marked `Secure` automatically once
  `NODE_ENV=production` — whichever host this ends up on needs to actually serve it over
  HTTPS for that to mean anything.

## Who this is for

Primarily Caroline Sugrue, running and planning ECRM team work. *(To confirm: other
contributors or audiences.)*

## Contributing

- Read [`CLAUDE.md`](CLAUDE.md) and [`docs/standards/README.md`](docs/standards/README.md)
  first.
- Raise bugs or new work through the issue templates rather than editing plans informally,
  so decisions, blockers and priorities stay visible.
- Mark anything not yet confirmed — an owner, a date, a decision, a benefit estimate — as
  "To confirm" rather than guessing.
