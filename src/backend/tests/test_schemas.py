import pytest
from pydantic import ValidationError

from datetime import datetime, timezone

from app.schemas import CommunityOut, NoteUpdate


def test_note_update_rejects_empty_string():
    with pytest.raises(ValidationError):
        NoteUpdate(note="      ")


def test_note_update_rejects_over_500_characters():
    with pytest.raises(ValidationError):
        NoteUpdate(note="a" * 501)


def test_note_update_accepts_valid_note():
    update = NoteUpdate(note="This is a test note.")
    assert update.note == "This is a test note."


def test_community_out_adds_utc_to_naive_datetime():
    community = CommunityOut(
        id=1,
        name="Test Community",
        created_by="Test User",
        created_on=datetime(2026, 1, 1, 12, 0, 0),
    )
    assert community.created_on.tzinfo == timezone.utc
