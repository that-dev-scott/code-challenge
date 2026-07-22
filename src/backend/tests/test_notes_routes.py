from datetime import datetime, timezone

from app.models import Community


def test_create_and_get_note(client, db_session):
    now = datetime.now(timezone.utc)
    community = Community(name="Test Community", created_by="Test User", created_on=now)
    db_session.add(community)
    db_session.commit()
    db_session.refresh(community)

    create_response = client.post(
        f"/communities/{community.id}/notes", json={"note": "This is a test note."}
    )
    assert create_response.status_code == 201
    note_id = create_response.json()["id"]

    get_response = client.get(f"/communities/{community.id}/note/{note_id}")
    assert get_response.status_code == 200
    assert get_response.json()["note"] == "This is a test note."


def test_update_note(client, db_session):
    now = datetime.now(timezone.utc)
    community = Community(name="Test Community", created_by="Test User", created_on=now)
    db_session.add(community)
    db_session.commit()
    db_session.refresh(community)

    create_response = client.post(
        f"/communities/{community.id}/notes", json={"note": "This is a test note."}
    )
    note_id = create_response.json()["id"]

    update_response = client.put(
        f"/communities/{community.id}/notes/{note_id}",
        json={"note": "This is an updated test note."},
    )
    assert update_response.status_code == 200
    body = update_response.json()
    assert body["note"] == "This is an updated test note."
    assert body["updated_by"] is not None
    assert body["updated_on"] is not None


def test_get_note_missing_community_returns_404(client):
    response = client.get("/communities/9999/note/1")
    assert response.status_code == 404


def test_get_note_missing_note_returns_404(client, db_session):
    now = datetime.now(timezone.utc)
    community = Community(name="Test Community", created_by="Test User", created_on=now)
    db_session.add(community)
    db_session.commit()
    db_session.refresh(community)

    response = client.get(f"/communities/{community.id}/note/9999")
    assert response.status_code == 404


def test_create_note_rejects_blank_note(client, db_session):
    now = datetime.now(timezone.utc)
    community = Community(name="Test Community", created_by="Test User", created_on=now)
    db_session.add(community)
    db_session.commit()
    db_session.refresh(community)

    response = client.post(f"/communities/{community.id}/notes", json={"note": "   "})
    assert response.status_code == 422


def test_create_note_rejects_over_500_characters(client, db_session):
    now = datetime.now(timezone.utc)
    community = Community(name="Test Community", created_by="Test User", created_on=now)
    db_session.add(community)
    db_session.commit()
    db_session.refresh(community)

    response = client.post(f"/communities/{community.id}/notes", json={"note": "a" * 501})
    assert response.status_code == 422


def test_update_note_rejects_blank_note(client, db_session):
    now = datetime.now(timezone.utc)
    community = Community(name="Test Community", created_by="Test User", created_on=now)
    db_session.add(community)
    db_session.commit()
    db_session.refresh(community)

    create_response = client.post(
        f"/communities/{community.id}/notes", json={"note": "This is a test note."}
    )
    note_id = create_response.json()["id"]

    response = client.put(
        f"/communities/{community.id}/notes/{note_id}", json={"note": "   "}
    )
    assert response.status_code == 422

    # The original note is untouched.
    get_response = client.get(f"/communities/{community.id}/note/{note_id}")
    assert get_response.json()["note"] == "This is a test note."


def test_update_note_rejects_over_500_characters(client, db_session):
    now = datetime.now(timezone.utc)
    community = Community(name="Test Community", created_by="Test User", created_on=now)
    db_session.add(community)
    db_session.commit()
    db_session.refresh(community)

    create_response = client.post(
        f"/communities/{community.id}/notes", json={"note": "This is a test note."}
    )
    note_id = create_response.json()["id"]

    response = client.put(
        f"/communities/{community.id}/notes/{note_id}", json={"note": "a" * 501}
    )
    assert response.status_code == 422
