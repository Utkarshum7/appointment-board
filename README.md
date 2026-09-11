# Appointment Board

A small internal tool for a team to manage appointments: view them on a board, add new ones,
edit or cancel existing ones, and mark them completed — with double-booking prevention built
into the backend, and an accessible, responsive UI on top of it.

Built as a technical assignment for Appening Infotech (Full Stack Developer Intern).

**Repository:** https://github.com/Utkarshum7/appointment-board (public)
**Live frontend:** https://comforting-pony-8b8dc5.netlify.app
**Live backend:** https://appointment-board-api-qcdn.onrender.com ([`/health`](https://appointment-board-api-qcdn.onrender.com/health), [`/docs`](https://appointment-board-api-qcdn.onrender.com/docs))

Both verified live and working end-to-end — see [Section 22](#22-deployment) for the full
verification record and architecture.

## 1. Project Overview

The app is a single board view. A team member can see every appointment, filter it down by
date or status, and act on any of them (edit, cancel, complete). Creating or editing an
appointment goes through validation on both the frontend (for instant feedback) and the
backend (as the final authority), including a check that the requested time slot doesn't
overlap an existing appointment.

## 2. Features

- View all appointments on a board (title, description, date, time, status), with a live
  count of how many are currently shown
- Add a new appointment
- Edit an existing (scheduled) appointment
- Cancel an appointment, with a confirmation step (stays visible, marked "Cancelled" with a
  strikethrough title — not just a color change)
- Mark an appointment as completed
- Filter by date and/or status, with a one-click "Clear filters" and a distinct empty state
  for "no results" vs. "no appointments at all"
- Required-field validation and "end time after start time" validation, shown inline per field
- Time-slot conflict detection, including on edit, with a specific error naming the
  conflicting appointment
- Success/error toasts, inline form errors, loading/empty/error states, and a retry action
  when the backend is unreachable
- Keyboard-friendly modal (auto-focused first field, closes on Escape or backdrop click,
  proper `role="dialog"`/`aria-*` wiring)
- A `/health` endpoint for deployment platforms to check the service is up
- Six sample appointments across three dates and all three statuses, seeded automatically

## 3. Tech Stack

| Layer    | Choice |
|----------|--------|
| Frontend | React 19 (Vite), plain CSS |
| Backend  | Python, FastAPI, SQLAlchemy, Pydantic |
| Database | SQLite for local dev (see [Section 8](#8-database-setup)); **Neon PostgreSQL in production** |
| Testing  | pytest + FastAPI's TestClient (31 tests) |

No UI component library, no state management library, no ORM migrations tool — the app is
small enough that these would add ceremony without adding value.

## 4. Architecture

```
React (Vite dev server / static build)
        │  fetch() JSON over HTTP, base URL from VITE_API_URL
        ▼
FastAPI REST API  (CORS-restricted to the frontend's origin)
        │  SQLAlchemy ORM, connection string from DATABASE_URL
        ▼
SQLite file (dev) / PostgreSQL (optional, same code)
```

The frontend never talks to the database directly, and the backend never renders HTML — a
plain REST boundary between the two, which is also what makes the backend independently
testable (the 31 backend tests exercise the API with no browser involved).

## 5. Project Structure

```
Appening-assignment/
├── backend/
│   ├── app/
│   │   ├── main.py       # FastAPI app, routes, CORS, /health
│   │   ├── models.py     # SQLAlchemy Appointment model
│   │   ├── schemas.py    # Pydantic request/response schemas + validation
│   │   ├── crud.py       # DB queries, including the conflict check
│   │   ├── database.py   # engine/session setup
│   │   └── seed.py       # sample data
│   ├── tests/
│   │   ├── conftest.py
│   │   └── test_appointments.py   # 31 tests
│   ├── requirements.txt
│   ├── Procfile           # for platform deployment (see Section 13)
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # top-level state + data flow
│   │   ├── api.js                # fetch wrapper for the backend
│   │   └── components/
│   │       ├── Board.jsx         # list, loading/empty/error states
│   │       ├── AppointmentCard.jsx
│   │       ├── AppointmentForm.jsx   # add/edit modal
│   │       ├── Filters.jsx
│   │       └── Toast.jsx
│   └── .env.example
├── docker-compose.yml     # optional local Postgres
├── render.yaml            # optional deployment blueprint (see Section 13)
└── README.md
```

## 6. Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- (Optional) Docker, only if you want to run Postgres instead of SQLite

## 7. Installation / Setup

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
copy .env.example .env       # Windows; use `cp` on macOS/Linux

# Frontend
cd ../frontend
npm install
copy .env.example .env
```

## 8. Environment Variables

**backend/.env**
| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./appointments.db` | SQLAlchemy connection string |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated origins allowed to call the API |

**frontend/.env**
| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Base URL the frontend calls |

Neither `.env` file is committed; only the `.env.example` templates are.

## 9. Database Setup

The assignment calls for PostgreSQL or MySQL. **Local development uses SQLite by default**,
and the **deployed production backend actually runs against Neon PostgreSQL** (see
[Section 22](#22-deployment)) — this was a deliberate, documented split, not a shortcut:

- The database is accessed entirely through SQLAlchemy, so the only thing that changes
  between SQLite and Postgres is the `DATABASE_URL` string — the models, queries, and
  conflict-detection logic are identical either way.
- `date` and `status` are indexed columns, since those are exactly the fields the API
  filters on.
- A `docker-compose.yml` is included to run Postgres locally in one command, for anyone who
  wants to actually run this against Postgres:

  ```bash
  docker compose up -d
  ```

  Then in `backend/.env`:
  ```
  DATABASE_URL=postgresql://appointments:appointments@localhost:5432/appointments
  ```

  `psycopg2-binary` is already in `requirements.txt` for this path.

No migrations tool (e.g. Alembic) is used — `Base.metadata.create_all()` creates the schema
on startup, which is enough for a schema this small and unlikely to change after review.

Tables are created and sample data is seeded automatically the first time the backend starts
(see [Section 17](#17-sample-data)). Deleting `backend/appointments.db` and restarting the
server recreates a clean, freshly-seeded database.

## 10. How to Run the Backend

```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

API docs (Swagger UI) are available at `http://localhost:8000/docs`.
A liveness check is available at `http://localhost:8000/health`.

## 11. How to Run the Frontend

```bash
cd frontend
npm run dev
```

Opens at `http://localhost:5173`. The backend must be running for the board to load data.

## 12. API Overview

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness check |
| GET | `/appointments?date=&status=` | List appointments, optionally filtered |
| GET | `/appointments/{id}` | Get one appointment |
| POST | `/appointments` | Create an appointment |
| PUT | `/appointments/{id}` | Edit an appointment (must be `scheduled`) |
| PATCH | `/appointments/{id}/cancel` | Cancel an appointment |
| PATCH | `/appointments/{id}/complete` | Mark an appointment completed |

**Status codes used:**
- `200` — successful GET/PUT/PATCH
- `201` — appointment created
- `400` — malformed query parameter (e.g. bad date format)
- `404` — appointment not found
- `409` — time conflict, or an invalid status transition (e.g. editing a cancelled appointment)
- `422` — request body/query failed validation (missing field, end time not after start time,
  an unrecognized status value)

## 13. Appointment Conflict Logic

Two appointments on the **same date** overlap when:

```
A.start_time < B.end_time  AND  A.end_time > B.start_time
```

This is implemented once, in [`backend/app/crud.py`](backend/app/crud.py)'s `find_conflict`,
and used by both the create and update endpoints so there's a single source of truth.

- **Adjacent appointments are allowed.** `09:00–10:00` followed by `10:00–11:00` does not
  conflict, because the check uses strict `<` / `>`, not `<=` / `>=`. A slot's end time is
  exclusive, so back-to-back bookings are a normal, allowed case for a team board.
- **Editing excludes itself.** `find_conflict` takes an `exclude_id` parameter; the update
  endpoint passes the appointment's own id so it never conflicts with the slot it already
  occupies.
- **Cancelled appointments do not block a slot.** The conflict query filters out
  `status == cancelled`. Once cancelled, that time is free for someone else to book. This
  matches how a real team calendar behaves — cancelling an appointment should free the
  room/slot, not keep it permanently reserved. (Completed appointments still block the slot
  they occupied, since they represent time that genuinely happened.)

## 14. Validation Rules

**Enforced by the backend (final authority) via Pydantic schemas in `schemas.py`:**
- `title` is required and non-blank (whitespace-only titles are rejected)
- `description` is optional; `None` is normalized to an empty string, and it's trimmed
- `date`, `start_time`, `end_time` are required and must be valid date/time values
- `end_time` must be strictly after `start_time`
- the time slot must not overlap an existing non-cancelled appointment on the same date

**Also enforced by the frontend** (in `AppointmentForm.jsx`) purely for instant feedback —
so a user sees "Title is required" without waiting on a network round trip. The frontend
check is a UX convenience; the backend re-validates everything regardless, because a
frontend check can be bypassed (browser devtools, a direct API call, a future second
frontend) and the backend is the only place that can safely be trusted.

## 15. Status Behavior

Status is one of `scheduled`, `completed`, `cancelled`. Allowed transitions, enforced in
`main.py`:

- `scheduled → completed` (via `/complete`)
- `scheduled → cancelled` (via `/cancel`)
- Editing (`PUT`) is only allowed while `scheduled` — a completed or cancelled appointment
  is historical record at that point, not something to be edited further.
- You cannot complete a cancelled appointment, or cancel a completed one — both return `409`
  with a clear message.

Cancelled appointments are **never deleted**. They stay in the database and on the board,
shown with a "Cancelled" badge and a struck-through title (not just a color change, so the
status still reads clearly for colorblind users), with no action buttons.

## 16. Accessibility Notes

A few concrete things done, not just "accessible" as a claim:
- Every form input has a real, associated `<label>` (no placeholder-as-label).
- Invalid fields get `aria-invalid` and `aria-describedby` pointing at their error message.
- The add/edit modal is a proper `role="dialog"` with `aria-modal`, auto-focuses its first
  field on open, closes on `Escape` or a backdrop click, and its heading is wired via
  `aria-labelledby`.
- Loading, error, and toast messages use `role="status"` / `role="alert"` so screen readers
  announce them.
- Status is never color-only: each status also has a text badge, and cancelled appointments
  additionally get a struck-through title.
- Focus-visible outlines are defined explicitly for keyboard navigation.

## 17. Sample Data

On first run (when the appointments table is empty), `backend/app/seed.py` inserts six
appointments spread across three consecutive days, covering all three statuses (scheduled,
completed, cancelled) so the board, its filters, and every status can be seen immediately
without creating data by hand.

## 18. Testing

```bash
cd backend
venv\Scripts\activate
pytest -v
```

31 tests, all passing, covering: valid creation, required-field validation, end-after-start
validation, an exhaustive set of overlap shapes (identical slot, partial overlap at the start,
partial overlap at the end, fully contained, fully containing), adjacent slots being allowed,
different dates not conflicting, editing without self-conflict, editing into another
appointment's slot, cancelled appointments staying visible, a cancelled slot being reusable,
completing, invalid status transitions (completing a cancelled one, cancelling a completed
one), filtering by date, by status, and by both combined, 404s on get/update/cancel/complete
for a nonexistent id, a malformed date filter (400), an invalid status filter value (422), the
description defaulting to an empty string, and the health check.

The frontend has no automated test suite; testing effort was concentrated on the backend's
business logic (conflict detection, validation, status transitions), which is where a bug
would actually be dangerous. The full user journey was instead verified manually end-to-end
in a real browser (see [Section 20](#20-known-limitations) and the verification notes below).

## 19. Verification Performed

Both servers were run and exercised end-to-end in a real browser before calling this done:
created, edited, completed, and cancelled real appointments through the UI; confirmed a
cancelled appointment remains visible with a struck-through title and no actions; confirmed
an overlapping slot is rejected with a specific, named error; confirmed date and status
filters (including combined) narrow the board and update the "Showing N appointments" count;
confirmed the two distinct empty states (no appointments at all vs. no results for the
current filters) each show their own actionable button; confirmed the modal's autofocus,
Escape-to-close, and backdrop-click-to-close; confirmed the error state (backend stopped) and
its "Try again" button recover without a full page reload; confirmed data survives a full
browser refresh (real database persistence, not just React state); checked the layout at
desktop, tablet (768px), and mobile (375px) widths with no horizontal overflow; checked the
browser console and backend logs for unexpected errors (none — every logged error corresponds
to a deliberate validation/conflict/downtime test). `npm run lint` (oxlint) and
`npm run build` both pass with no warnings or errors.

## 20. Known Limitations

- No authentication — anyone with access to the frontend can see and modify all appointments.
- No pagination — `GET /appointments` returns the full list, fine for a small team's board
  but would need pagination at real scale.
- No timezone handling — dates/times are stored and compared as naive values; fine for a
  single-team, single-timezone tool, not for a distributed team.
- No automated frontend tests (see [Section 18](#18-testing) for why effort went to the
  backend instead).
- The SQLite file (`backend/appointments.db`) is a single local file — fine for local
  development/review, not for concurrent multi-writer production use. If two people submit
  a genuinely simultaneous booking for the same slot, the database still serializes the two
  writes and the second one correctly gets a 409 — SQLite/Postgres transactions make this
  safe even though there's no application-level locking code. What SQLite doesn't give you
  at scale is concurrent *write throughput*; that's a reason to move to Postgres under real
  load, not a correctness gap.

## 21. Future Improvements

Given more time, in priority order: authentication (even a single shared team password would
remove the "anyone can cancel anything" gap), optimistic UI updates instead of re-fetching
the whole list after every mutation, pagination once the list is large, a recurring-appointment
option, and a small frontend test suite (React Testing Library) covering the form validation
and the conflict-error rendering path.

## 22. Deployment

**Status: live and verified.**

| Layer | Platform | URL |
|---|---|---|
| Frontend | Netlify | https://comforting-pony-8b8dc5.netlify.app |
| Backend | Render (free Web Service) | https://appointment-board-api-qcdn.onrender.com |
| Database | Neon (free, permanent Postgres) | connection string held only in Render's env vars |

**Production architecture:**
```
React static build (Netlify)
        │  HTTPS, VITE_API_URL baked in at build time
        ▼
FastAPI on Render (free Web Service), reading $PORT from the platform
        │  DATABASE_URL points at Neon Postgres
        ▼
Neon PostgreSQL (managed, free tier)
```

**Why this combination:** every platform here was chosen because it is genuinely free with
no credit card, verified by checking each provider's current pricing page directly rather
than assuming. Render's Blueprint flow (bundling a database) demanded payment details before
provisioning anything, so the actual deployment uses a **standalone Render Web Service**
instead (no `render.yaml`/Blueprint), pointed at an external Neon database — Render never
provisioned a database itself, so it never asked for payment. `render.yaml` is kept in the
repo for reference but was not the mechanism actually used.

**Environment variables actually set (names only — see each provider's dashboard for values,
never committed to this repo):**
- Render: `DATABASE_URL`, `CORS_ORIGINS`, `PYTHON_VERSION`
- Netlify: `VITE_API_URL`

**Two real deployment issues hit and fixed along the way:**
1. **Build failed — `requirements.txt` not found.** Root cause: the Render service's Root
   Directory setting was empty, so the build ran at the repo root instead of `backend/`.
   Fixed by setting Root Directory to `backend` (Render dashboard setting, no code change).
2. **Build failed — Rust compile error for `pydantic-core`.** Root cause: Render defaulted
   new services to Python 3.14.3, which has no prebuilt wheel for `pydantic-core==2.23.4`;
   pip fell back to compiling it from source via `maturin`, which fails in Render's build
   sandbox (read-only Cargo cache). Fixed by setting `PYTHON_VERSION=3.12.7` (matching local
   dev), which restored the prebuilt-wheel path — confirmed in the build log
   (`pydantic_core-2.23.4-cp312-...whl` downloaded, not compiled). No code change.
3. **Netlify published "Page not found."** Root cause: the Netlify site's Base directory,
   Build command, and Publish directory were all unset, so it published the raw repository
   checkout instead of running a Vite build. Confirmed via Netlify's deploy file browser,
   which showed `backend/`, `frontend/`, `render.yaml`, etc. at the top level instead of a
   built `index.html`. Fixed by setting Base directory `frontend`, Build command
   `npm run build`, Publish directory `dist` (resolved to `frontend/dist`). Re-deployed and
   confirmed the file browser now shows `dist/index.html` and `dist/assets/*`.
4. **CORS blocked the first successful frontend load.** Expected and by design — Render's
   `CORS_ORIGINS` was still the local dev placeholder until the real Netlify URL existed.
   Updated to the exact Netlify origin and redeployed; confirmed via a direct `OPTIONS`
   request that the response now carries
   `access-control-allow-origin: https://comforting-pony-8b8dc5.netlify.app`.
5. **The Netlify site returned `401` to anyone without a Netlify login, even though it
   loaded fine in the authenticated dashboard browser.** Root cause: Netlify's current
   default for new projects sets Production visibility to "Private" (team-login-only) —
   an access-control setting, unrelated to the build. Caught specifically because the app
   was checked with a plain, cookie-less `curl` request in addition to the browser (the
   browser session was already authenticated into Netlify, which masked the problem — a
   reminder that "it loads for me" isn't proof it's public). Fixed via Project
   configuration → Visitor access → Project visibility → **Public**. Reconfirmed
   immediately after with the same `curl` command returning `200` with the real
   `index.html`, not a login page.

**Verification actually performed against the live stack** (not claimed, executed): all 16
backend API checks in Section 19's style re-run against the live Render URL (create, missing
fields, bad time range, overlap rejection, free-slot success, edit without self-conflict, edit
into a genuine conflict, complete, cancel, cancelled-stays-visible, cancelled-slot-reuse, date
filter, status filter) — all 16 passed. A real appointment was then created, verified, and
cancelled through the actual public Netlify UI end-to-end. Render's application logs were
read directly and show zero unexpected errors — only the expected 200/201/409/422 sequence
from these tests, plus the CORS-preflight 400s from before the CORS fix (expected, not a
bug). A fresh, history-free browser tab was used to confirm no console errors on a clean load
of the production frontend. Both the frontend and backend URLs were also checked with plain
`curl` (no cookies, no browser session) to confirm they are genuinely public, not just
reachable from an already-authenticated dashboard session.

**Known operational limitation:** Render's free instance spins down after 15 minutes of
inactivity; the first request after idle can take up to ~50 seconds while it wakes up. This
is a free-tier characteristic, not an application bug — documented here so it isn't mistaken
for the app being broken during a demo.

## 23. Interview-Critical Concepts

The parts of this project worth understanding cold before a follow-up interview:

- **Why SQLite locally:** no Postgres/Docker daemon was actually available in the build
  environment, and running SQLite for real end-to-end testing was judged better than
  claiming an untested Postgres setup. The switch to Postgres is a one-line `DATABASE_URL`
  change because SQLAlchemy is the only thing that touches the database directly.
- **The conflict algorithm:** `A.start < B.end AND A.end > B.start`, same date,
  `status != cancelled`, with the appointment's own id excluded on edit. One function
  (`find_conflict`), used by both create and update.
- **What happens if two people try to book the same slot at once:** there's no explicit
  locking code, but the database transaction for whichever `INSERT`/`UPDATE` commits second
  will simply fail the conflict check against the first one's now-committed row, and that
  request gets a 409. Correctness comes from the database's transaction isolation, not from
  application-level coordination.
- **Why the backend validates even though the frontend does too:** frontend validation is a
  UX nicety and is trivially bypassable (devtools, curl, a second client); the backend is the
  only place that can be trusted, so every rule is enforced there regardless of what the
  frontend already checked.
- **Why edits are restricted to `scheduled` appointments:** keeps completed/cancelled
  appointments as an honest, immutable historical record.
- **CORS:** the backend allows only the origins listed in `CORS_ORIGINS`; in dev that's
  `http://localhost:5173`, in production it would be the deployed frontend's exact origin.
- **How the frontend and backend actually talk:** plain `fetch()` calls returning JSON,
  wrapped in `frontend/src/api.js`; the base URL comes from `VITE_API_URL`, never hardcoded.
- **How I'd scale this:** move to Postgres (already supported), add pagination and indexes
  on the filtered columns (already added for `date`/`status`), and consider optimistic
  frontend updates so every mutation doesn't require a full list re-fetch.
