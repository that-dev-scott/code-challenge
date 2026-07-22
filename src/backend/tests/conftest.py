"""
Pytest fixtures shared across test files.

Provides:
- `client`: a FastAPI TestClient wired to a throwaway in-memory SQLite
  database instead of app.db, so tests never touch (or depend on) your
  real data. Use this for testing routes once you've written them.
- `db_session`: a raw SQLAlchemy session against that same throwaway
  database, for testing models directly without going through HTTP.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app import models  # noqa: F401 (import registers tables on Base.metadata)
from app.main import app

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,  # keeps the same in-memory DB alive across connections
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Replaces `app.database.get_db` for the test app: same shape, throwaway DB."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture()
def client():
    """A TestClient with fresh, empty tables for the duration of the test."""
    Base.metadata.create_all(bind=engine)  # fresh tables for each test
    try:
        yield TestClient(app)
    finally:
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session():
    """A raw SQLAlchemy session against fresh, empty tables, for testing models directly."""
    Base.metadata.create_all(bind=engine)  # fresh tables for each test
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
