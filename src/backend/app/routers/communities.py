"""
Endpoints for listing communities.

Notes themselves are handled separately in routers/notes.py — a community's
notes are fetched via GET /communities/{community_id}/notes, not nested here.

Wire this router into app/main.py with:
    app.include_router(communities.router, prefix="/communities", tags=["communities"])
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db

from app.models import Community
from app.schemas import CommunityOut

router = APIRouter()


@router.get("/", response_model=list[CommunityOut])
def list_communities(db: Session = Depends(get_db)):
    """List all communities, alphabetically by name."""
    return db.query(Community).order_by(Community.name).all()


@router.get("/{community_id}", response_model=CommunityOut)
def get_community(community_id: int, db: Session = Depends(get_db)):
    """Fetch a single community, or 404 if it doesn't exist."""
    community = db.query(Community).filter(Community.id == community_id).first()
    if community is None:
        raise HTTPException(status_code=404, detail="Community not found.")

    return community
