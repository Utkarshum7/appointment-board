# Appointment Board

A small internal tool for a team to manage appointments: view them on a board, add new ones,
edit or cancel existing ones, and mark them completed — with double-booking prevention built
into the backend, and an accessible, responsive UI on top of it.

Built as a technical assignment for Appening Infotech (Full Stack Developer Intern).

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
| Database | SQLite by default (see [Section 8](#8-database-setup) for why), Postgres-ready |
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

The assignment calls for PostgreSQL or MySQL. This app uses **SQLite by default** instead,
and that's a deliberate, documented decision, not a shortcut taken silently:

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

This section documents what's been prepared for deployment and what was actually done. No
hosting platform CLI or account was available in the environment this was built in (no
Vercel/Netlify/Render/Railway/Fly CLI was installed or authenticated — verified by checking
for each), so **nothing has been deployed, and there is no live URL** to share. What follows
is a ready-to-use deployment path and the exact manual steps to finish it.

**What's already in place:**
- `backend/Procfile` — `web: uvicorn app.main:app --host 0.0.0.0 --port $PORT`, the standard
  start command most Python hosts (Render, Railway, Heroku-style buildpacks) look for.
- `render.yaml` — a Render "Blueprint" that defines the backend web service, the frontend as
  a static site, and a free Postgres database in one file. **This has not been deployed or
  verified against a live Render account** — it's written against Render's documented
  blueprint format as a starting point; check the field names against Render's current docs
  before relying on it.
- The frontend already builds cleanly for production (`npm run build` verified — see
  Section 19) and reads its API base URL from `VITE_API_URL` at build time, so it never
  hardcodes `localhost`.
- The backend already reads its database and CORS configuration from environment variables,
  so no code changes are needed to point it at a managed Postgres instance or a different
  frontend origin.

**Manual steps to actually deploy (none of these could be done from this environment):**
1. Push this repository to GitHub (the assignment doesn't require this, but Render/Railway/
   Vercel/Netlify all deploy from a connected Git repo).
2. Backend: create a Python web service on Render (or Railway/Fly) pointed at `backend/`,
   with build command `pip install -r requirements.txt` and start command from the
   `Procfile`. Set `DATABASE_URL` to a managed Postgres connection string and `CORS_ORIGINS`
   to the frontend's deployed URL.
3. Database: create a managed Postgres instance (Render's free Postgres, Neon, or Supabase
   all work) and use its connection string as `DATABASE_URL` above.
4. Frontend: create a static site on Render/Vercel/Netlify pointed at `frontend/`, build
   command `npm run build`, publish directory `dist`, with `VITE_API_URL` set to the
   backend's deployed URL.
5. Verify: open the frontend URL, confirm the board loads sample data, and exercise
   create/edit/complete/cancel/filter once against the live backend.

If you complete these steps and want the README updated with the real URLs, share them and
they can be added — but they will not be fabricated here.

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
