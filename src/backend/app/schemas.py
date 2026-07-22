"""
Pydantic schemas: the shapes of data going in/out of the API (request
bodies and response models). These are separate from the SQLAlchemy
models in models.py — models.py describes DB tables, this file describes
the JSON the API accepts and returns.

Docs: https://fastapi.tiangolo.com/tutorial/body/
"""

from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timezone


class CommunityOut(BaseModel):
    """Response shape for a community, returned directly from the ORM model."""

    id: int
    name: str
    created_by: str
    created_on: datetime
    updated_by: str | None = None
    updated_on: datetime | None = None

    model_config = {"from_attributes": True}

    @field_validator("created_on", "updated_on")
    @classmethod
    def ensure_utc(cls, value: datetime | None) -> datetime | None:
        """SQLite drops tzinfo on read; assume UTC so clients don't have to guess."""
        if value is not None and value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value


class NoteOut(BaseModel):
    """Response shape for a note, returned directly from the ORM model."""

    id: int
    community_id: int
    note: str
    created_by: str
    created_on: datetime
    updated_by: str | None = None
    updated_on: datetime | None = None

    model_config = {"from_attributes": True}

    @field_validator("created_on", "updated_on")
    @classmethod
    def ensure_utc(cls, value: datetime | None) -> datetime | None:
        """SQLite drops tzinfo on read; assume UTC so clients don't have to guess."""
        if value is not None and value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value


class NoteUpdate(BaseModel):
    """Request body for creating or updating a note.

    Enforces the two functional requirements that apply to note text: not
    blank, and no more than 500 characters.
    """

    note: str = Field(max_length=500)

    @field_validator("note")
    @classmethod
    def not_blank(cls, value: str) -> str:
        """Rejects empty or whitespace-only note text."""
        if not value.strip():
            raise ValueError("Note cannot be blank.")
        return value
