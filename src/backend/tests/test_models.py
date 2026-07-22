import pytest
from sqlalchemy.exc import IntegrityError

from datetime import datetime, timezone

from app.models import Community, Note


def test_note_links_to_community(db_session):
    now = datetime.now(timezone.utc)

    community = Community(name="Test Community", created_by="Test User", created_on=now)
    db_session.add(community)
    db_session.commit()

    note = Note(
        community_id=community.id,
        note="This is a test note.",
        created_by="Test User",
        created_on=now,
    )
    db_session.add(note)
    db_session.commit()

    assert note.community is community
    assert note in community.notes


def test_note_requires_content(db_session):
    now = datetime.now(timezone.utc)

    community = Community(name="Test Community", created_by="Test User", created_on=now)
    db_session.add(community)
    db_session.commit()

    note = Note(
        community_id=community.id,
        note=None,
        created_by="Test User",
        created_on=now,
    )
    db_session.add(note)
    with pytest.raises(IntegrityError):
        db_session.commit()
