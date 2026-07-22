"""
Example test showing the pattern: use the `client` fixture from conftest.py
to hit an endpoint and assert on the response.

This does NOT satisfy the assignment's "at least one automated test"
requirement on its own — add tests that cover your actual notes
functionality (e.g. saving a note, rejecting a blank note, rejecting a
note over 500 characters) in a new test_notes.py file.
"""


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
