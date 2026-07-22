# Community Notes

A small application for a community manager to view communities and maintain notes per community.

## Structure

```
src/
  backend/    FastAPI + SQLAlchemy + SQLite
  frontend/   React + TypeScript (Vite)
```

## Backend setup

```
cd src/backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload
```

- The API runs on http://localhost:8000.
- A SQLite file (`app.db`) is created in `src/backend` on first run.
- `seed.py` populates the `app.db` with a handful of sample communities/notes. It is safe to re-run, it skips seeding if communities/notes already exist.

### Backend tests

```
cd src/backend
# with the venv above active
pytest
```

## Frontend setup

```
cd src/frontend
npm install
npm run dev
```

The app runs at http://localhost:5173 and expects the backend running at http://localhost:8000 (see `src/frontend/src/services/api/client.ts`).

## Running both

Two terminals: one running the backend (`uvicorn app.main:app --reload`), one running the frontend (`npm run dev`).

Start the backend first so the frontend's requests have something to hit. :)

---

## Application structure

**Backend** (`src/backend/app/`)

- `main.py` — FastAPI app setup, CORS, and router wiring.
- `models.py` — SQLAlchemy tables: `Community` and `Note`, with a 1-N relationship (a community can have many notes).
- `schemas.py` — Pydantic request/response shapes, kept separate from the ORM models so the API contract can evolve independently of the DB schema.
- `routers/communities.py`, `routers/notes.py` — list communities, and list/create/update a community's notes.
- `seed.py` — populates `app.db` with sample communities and notes for local development.

**Frontend** (`src/frontend/src/`)

- `main.tsx` → `App.tsx` → `router/index.tsx` — `App.tsx` is intentionally thin; it just renders the router. `router/index.tsx` owns `BrowserRouter`/`Routes` and maps both `/` and `/communities/:communityId` to the same page.
- `pages/CommunityNotesPage.tsx` — the page-level component. Reads the selected community from the URL, fetches communities/notes, and orchestrates loading/error/success state.
- `components/` — presentational pieces (`Header`, `NoteCard`, `NewNoteCard`, `SuccessBanner`, `Loading`), each usable and testable independent of the page that composes them.
- `services/api/client.ts` — thin fetch wrapper around the FastAPI backend, including the `ApiError` type used to surface backend validation messages.

## Technical decisions

- **Separate tables for communities and notes** with a 1-N relationship.
- **Selected community lives in the URL** instead of local component state, so the current view is bookmark/shareable and survives a page refresh.
- **Pydantic schemas separate from SQLAlchemy models** so the JSON the API accepts/returns isn't tightly coupled to the DB table shape.
- **Router and API client isolated into their own folders** (`router/`, `services/api/`), with page-level data-fetching logic (`pages/`) kept separate from reusable presentational components.
- **No authentication in scope** — `created_by`/`updated_by` are hardcoded (`"Community Manager"` for API-created notes and `"seed_script"` for seeded data) rather than left null, so the attribution UI has something to render.

## Validation and error handling

- Blank notes and notes over 500 characters are rejected in two independent layers:
  - **Frontend**: `NoteCard`/`NewNoteCard` validate before calling the API, and the textarea has a hard `maxLength={500}`.
  - **Backend**: the `NoteUpdate` enforces the same two rules regardless of the client, returning a `422` with a message if violated.
- The frontend unwraps backend error responses via a thin `ApiError`, which reads FastAPI's `detail` field and falls back to a generic message for non-`ApiError` failures.
- **Loading**: a spinner/message will show while communities or notes are being loaded/fetched; Save/Add buttons disable and read "Saving..." while a create/update request is being executed.
- **Success**: `SuccessBanner` shows a transient confirmation after a note is created or edited and will slide up after a few seconds.
- **Error**: a banner shows if communities or notes fail to load; a failed save shows its error inline on the note card being edited, without discarding the user's text.
- Requests for a nonexistent community or note return `404` from the API.

## What I'd improve with more time

1. Convert current hard coded configuration into actual environment-driven configurations for actual deployments to other environments.
2. Authentication; any user can create/update a note for any community.
   - Allows for 403 Unauthorized to be presented with the user is not authenticated.
   - This will also help with knowing who created the note; as well as who made an update to the note.
3. Authorization; all users have create/update access to all notes for all communities.
   - This will also allow us to assign specific communities to specific users instead of all users having access to all communities.
   - This will allow the application to scope access to various application functions (create authorization, update authorization, etc.).
4. Auditing; having an authenticated user helps in understanding who created a note or who last updated a note.
   - This will also allow for showing a change history per note in the UI.
   - Allows for auditing of notes for compliance purposes, internal/external audits, etc.
5. Add a mechanism to refresh; for fetching errors, etc.
6. Add the ability to delete a note (either a soft or hard delete).
7. Add the ability to pin or emphasis notes. Pinning a note to the top of the list, or otherwise making a specific note stand out more for importance.
8. Add the ability to filter communities and/or a notes.
9. Pagination of notes to prevent long page scrolling.
10. Schema migrations; as the schema drifts over time, we would need a way to manage those migrations.
11. Accessibility; there was no thought or effort put into accessibility for this exercise.
