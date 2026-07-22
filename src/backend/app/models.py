"""
SQLAlchemy ORM models (the tables in the database).

Each model is a class that inherits from `Base` (imported below).

Docs: https://docs.sqlalchemy.org/en/20/orm/quickstart.html
"""

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Community(Base):
    """A community a property manager oversees. Has many `Note`s."""

    __tablename__ = "communities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)

    created_by = Column(String, nullable=False)
    created_on = Column(DateTime, nullable=False)
    updated_by = Column(String)
    updated_on = Column(DateTime)

    notes = relationship("Note", back_populates="community")


class Note(Base):
    """A single note belonging to one community."""

    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False)
    note = Column(String, nullable=False)
    created_by = Column(String, nullable=False)
    created_on = Column(DateTime, nullable=False)
    updated_by = Column(String)
    updated_on = Column(DateTime)

    community = relationship("Community", back_populates="notes")
