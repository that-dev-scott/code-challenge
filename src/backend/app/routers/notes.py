"""
Endpoints for reading/writing a community's notes (a community can have
more than one note — see the 1-to-many Community.notes relationship in
models.py).

Validation to enforce here (functional requirements):
- NoteUpdate already rejects blank/whitespace-only and over-500-char notes (422)
- Return a sensible error (404) if the community_id or note_id doesn't exist

Wire this router into app/main.py with:
    app.include_router(notes.router, prefix="/communities", tags=["notes"])
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db

from datetime import datetime, timezone

from app.models import Community, Note
from app.schemas import NoteOut, NoteUpdate

router = APIRouter()


@router.get("/{community_id}/notes", response_model=list[NoteOut])
def list_notes(community_id: int, db: Session = Depends(get_db)):
    """List a community's notes, newest first."""
    return (
        db.query(Note)
        .filter(Note.community_id == community_id)
        .order_by(Note.created_on.desc())
        .all()
    )


@router.get("/{community_id}/note/{note_id}", response_model=NoteOut)
def get_note(community_id: int, note_id: int, db: Session = Depends(get_db)):
    """Fetch a single note, or 404 if the community or note doesn't exist."""
    note = (
        db.query(Note)
        .filter(Note.community_id == community_id, Note.id == note_id)
        .first()
    )
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found.")

    return note


@router.post("/{community_id}/notes", response_model=NoteOut, status_code=201)
def create_note(community_id: int, payload: NoteUpdate, db: Session = Depends(get_db)):
    """Create a new note for a community. `payload` is pre-validated (non-blank, <=500 chars) by `NoteUpdate`."""
    community = db.query(Community).filter(Community.id == community_id).first()
    if community is None:
        raise HTTPException(status_code=404, detail="Community not found.")

    note = Note(
        community_id=community_id,
        note=payload.note,
        created_by="Community Manager",  # This would normally be the authenticated user creating the note.
        created_on=datetime.now(
            timezone.utc
        ),  # Please for the love of sweet baby Jesus don't use some other time zone.
    )

    db.add(note)
    db.commit()
    db.refresh(note)

    return note


@router.put("/{community_id}/notes/{note_id}", response_model=NoteOut, status_code=200)
def update_note(
    community_id: int, note_id: int, payload: NoteUpdate, db: Session = Depends(get_db)
):
    """Overwrite a note's text. `payload` is pre-validated (non-blank, <=500 chars) by `NoteUpdate`."""
    community = db.query(Community).filter(Community.id == community_id).first()
    if community is None:
        raise HTTPException(status_code=404, detail="Community not found.")

    note = (
        db.query(Note)
        .filter(Note.community_id == community_id, Note.id == note_id)
        .first()
    )
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found.")

    note.note = payload.note
    note.updated_by = "Community Manager"  # This would normally be the authenticated user updating the note.
    note.updated_on = datetime.now(
        timezone.utc
    )  # Please for the love of sweet baby Jesus don't use some other time zone.

    db.commit()
    db.refresh(note)

    return note
