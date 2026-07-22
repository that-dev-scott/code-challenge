"""
One-off script to seed the database with sample communities and notes.

Run from src/backend, with the venv active:
    python seed.py
"""

import random
from datetime import datetime, timedelta, timezone

from app.database import Base, SessionLocal, engine
from app.models import Community, Note

COMMUNITY_NAMES = [
    "Durham Farms",
    "Power Ranch",
    "Grayhawk",
    "Estrella",
    "Daybreak",
    "Anthem Ranch",
    "Sterling Ranch",
    "Towne Lake",
]

LOREM_WORDS = (
    "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod "
    "tempor incididunt ut labore et dolore magna aliqua ut enim ad minim "
    "veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea "
    "commodo consequat duis aute irure dolor in reprehenderit in voluptate "
    "velit esse cillum dolore eu fugiat nulla pariatur excepteur sint "
    "occaecat cupidatat non proident sunt in culpa qui officia deserunt "
    "mollit anim id est laborum"
).split()


def lorem_sentence() -> str:
    """Build one capitalized, period-terminated sentence of random lorem-ipsum words."""
    words = random.choices(LOREM_WORDS, k=random.randint(6, 14))
    sentence = " ".join(words)
    return sentence[0].upper() + sentence[1:] + "."


def lorem_note() -> str:
    """Build a 1-3 sentence note, truncated to the 500-char limit the API enforces."""
    sentences = [lorem_sentence() for _ in range(random.randint(1, 3))]
    return " ".join(sentences)[:500]


def random_past_datetime(days_back: int = 30) -> datetime:
    """A random UTC timestamp within the last `days_back` days, for varied-looking seed data."""
    now = datetime.now(timezone.utc)
    delta = timedelta(
        days=random.randint(0, days_back),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59),
    )
    return now - delta


def seed_communities(db) -> None:
    """Insert the sample communities, unless communities already exist."""
    if db.query(Community).count() > 0:
        print("Communities already exist, skipping.")
        return

    now = datetime.now(timezone.utc)
    for name in COMMUNITY_NAMES:
        db.add(Community(name=name, created_by="seed_script", created_on=now))
    db.commit()
    print(f"Seeded {len(COMMUNITY_NAMES)} communities.")


def seed_notes(db) -> None:
    """Insert 0-5 random notes per existing community, unless notes already exist."""
    if db.query(Note).count() > 0:
        print("Notes already exist, skipping.")
        return

    total = 0
    for community in db.query(Community).all():
        for _ in range(random.randint(0, 5)):
            db.add(
                Note(
                    community_id=community.id,
                    note=lorem_note(),
                    created_by="seed_script",
                    created_on=random_past_datetime(),
                )
            )
            total += 1
    db.commit()
    print(f"Seeded {total} notes.")


def seed():
    """Create tables if needed, then seed communities and notes. Safe to re-run."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_communities(db)
        seed_notes(db)
    finally:
        db.close()


if __name__ == "__main__":
    seed()
