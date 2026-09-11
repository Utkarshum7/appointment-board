# Appointment Board

A small internal tool for a team to manage appointments: view them on a board, add new ones,
edit or cancel existing ones, and mark them completed — with double-booking prevention built
into the backend.

Built as a technical assignment for Appening Infotech (Full Stack Developer Intern).

## 1. Project Overview

The app is a single board view. A team member can see every appointment, filter it down by
date or status, and act on any of them (edit, cancel, complete). Creating or editing an
appointment goes through validation on both the frontend (for instant feedback) and the
backend (as the final authority), including a check that the requested time slot doesn't
overlap an existing appointment.

## 2. Features

- View all appointments on a board (title, description, date, time, status)
- Add a new appointment
- Edit an existing (scheduled) appointment
- Cancel an appointment (stays visible, marked "cancelled")
- Mark an appointment as completed
- Filter by date and/or status, with a one-click "Clear filters"
- Required-field validation and "end time after start time" validation
- Time-slot conflict detection, including on edit
- Success/error toasts, inline form errors, loading/empty/error states
- A few sample appointments seeded automatically on first run

## 3. Tech Stack

| Layer    | Choice |
|----------|--------|
| Frontend | React 19 (Vite), plain CSS |
| Backend  | Python, FastAPI, SQLAlchemy, Pydantic |
| Database | SQLite by default (see [Section 8](#8-database-setup) for why), Postgres-ready |
| Testing  | pytest + FastAPI's TestClient |

No UI component library, no state management library, no ORM migrations tool — the app is
small enough that these would add ceremony without adding value.

## 4. Project Structure

```
Appening-assignment/
├── backend/
│   ├── app/
│   │   ├── main.py       # FastAPI app, routes, CORS
│   │   ├── models.py     # SQLAlchemy Appointment model
│   │   ├── schemas.py    # Pydantic request/response schemas + validation
│   │   ├── crud.py       # DB queries, including the conflict check
│   │   ├── database.py   # engine/session setup
│   │   └── seed.py       # sample data
│   ├── tests/
│   │   ├── conftest.py
│   │   └── test_appointments.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # top-level state + data flow
│   │   ├── api.js                # fetch wrapper for the backend
│   │   └── components/
│   │       ├── Board.jsx
│   │       ├── AppointmentCard.jsx
│   │       ├── AppointmentForm.jsx
│   │       ├── Filters.jsx
│   │       └── Toast.jsx
│   └── .env.example
├── docker-compose.yml     # optional local Postgres
└── README.md
```

## 5. Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- (Optional) Docker, only if you want to run Postgres instead of SQLite

## 6. Installation / Setup

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

## 7. Environment Variables

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

## 8. Database Setup

The assignment calls for PostgreSQL or MySQL. This app uses **SQLite by default** instead,
and that's a deliberate, documented decision, not a shortcut taken silently:

- The database is accessed entirely through SQLAlchemy, so the only thing that changes
  between SQLite and Postgres is the `DATABASE_URL` string — the models, queries, and
  conflict-detection logic are identical either way.
- A `docker-compose.yml` is included to run Postgres locally in one command, for anyone who
  wants to actually run this against Postgres:

  ```bash
  docker compose up -d
  ```

  Then in `backend/.env`:
  ```
  DATABASE_URL=postgresql://appointments:appointments@localhost:5432/appointments
  ```

No migrations tool (e.g. Alembic) is used — `Base.metadata.create_all()` creates the schema
on startup, which is enough for a schema this small and unlikely to change after review.

Tables are created and sample data is seeded automatically the first time the backend starts
(see [Section 16](#16-sample-data)).

## 9. How to Run the Backend

```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

API docs (Swagger UI) are available at `http://localhost:8000/docs`.

## 10. How to Run the Frontend

```bash
cd frontend
npm run dev
```

Opens at `http://localhost:5173`. The backend must be running for the board to load data.

## 11. API Overview

| Method | Path | Description |
|---|---|---|
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
- `422` — request body failed validation (missing field, end time not after start time)

## 12. Appointment Conflict Logic

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

## 13. Validation Rules

**Enforced by the backend (final authority) via Pydantic schemas in `schemas.py`:**
- `title` is required and non-blank
- `date`, `start_time`, `end_time` are required and must be valid date/time values
- `end_time` must be strictly after `start_time`
- the time slot must not overlap an existing non-cancelled appointment on the same date

**Also enforced by the frontend** (in `AppointmentForm.jsx`) purely for instant feedback —
so a user sees "Title is required" without waiting on a network round trip. The frontend
check is a UX convenience; the backend re-validates everything regardless, because a
frontend check can be bypassed (browser devtools, a direct API call, a future second
frontend) and the backend is the only place that can safely be trusted.

## 14. Status Behavior

Status is one of `scheduled`, `completed`, `cancelled`. Allowed transitions, enforced in
`main.py`:

- `scheduled → completed` (via `/complete`)
- `scheduled → cancelled` (via `/cancel`)
- Editing (`PUT`) is only allowed while `scheduled` — a completed or cancelled appointment
  is historical record at that point, not something to be edited further.
- You cannot complete a cancelled appointment, or cancel a completed one — both return `409`
  with a clear message.

Cancelled appointments are **never deleted**. They stay in the database and on the board,
shown with a "cancelled" badge and no action buttons, so the team retains a full history of
what was booked and what fell through.

## 15. Important Assumptions

- **SQLite instead of Postgres/MySQL by default** — see [Section 8](#8-database-setup).
  Postgres is fully supported by changing one environment variable; it just isn't what ships
  running out of the box.
- **Cancelled appointments free their time slot** for new bookings; completed ones don't
  (see [Section 12](#12-appointment-conflict-logic)).
- **Editing is restricted to `scheduled` appointments.** The assignment doesn't specify this
  either way; disallowing edits on completed/cancelled appointments felt like the safer,
  more realistic default for a real audit trail.
- **A slot boundary is exclusive at the end.** `10:00–11:00` and `11:00–12:00` are allowed
  back-to-back, per the assignment's own example.
- **Single shared board, no authentication/authorization.** The assignment describes "a
  small team" without login requirements, so no user accounts, roles, or auth are
  implemented — every appointment is visible and editable by anyone with the app open.

## 16. Sample Data

On first run (when the appointments table is empty), `backend/app/seed.py` inserts five
appointments spread across today and tomorrow, covering all three statuses (scheduled,
completed, cancelled) so the board is immediately useful and every filter/status can be seen
without creating data by hand.

## 17. Known Limitations

- No authentication — anyone with access to the frontend can see and modify all appointments.
- No pagination — `GET /appointments` returns the full list, fine for a small team's board
  but would need pagination at real scale.
- No timezone handling — dates/times are stored and compared as naive values; fine for a
  single-team, single-timezone tool, not for a distributed team.
- No automated frontend tests — testing effort was concentrated on the backend's business
  logic (conflict detection, validation, status transitions), which is where a bug would
  actually be dangerous. The full user flow was verified manually end-to-end instead (see
  below).
- The SQLite file (`backend/appointments.db`) is a single local file — fine for local
  development/review, not for concurrent multi-writer production use.

## Testing

```bash
cd backend
venv\Scripts\activate
pytest -v
```

19 tests cover: valid creation, required-field validation, end-after-start validation,
overlapping slots (several overlap shapes), adjacent slots being allowed, different dates
not conflicting, editing without self-conflict, editing into another appointment's slot,
cancelled appointments staying visible, a cancelled slot being reusable, completing, invalid
status transitions (completing a cancelled one, cancelling a completed one), and filtering by
date and by status. All 19 pass.

## Verification Performed

Both servers were actually run and exercised end-to-end (not just unit-tested) before
calling this done: created, edited, completed, and cancelled real appointments through the
UI; confirmed a cancelled appointment remains visible with a badge and no actions; confirmed
an overlapping slot is rejected with a specific error message; confirmed date and status
filters (including combined) narrow the board correctly; confirmed empty and error states
render correctly (including with the backend stopped); checked the browser console and
backend logs for unexpected errors (none found — all logged errors correspond to the
deliberate validation/conflict tests). `npm run lint` passes with no warnings.
