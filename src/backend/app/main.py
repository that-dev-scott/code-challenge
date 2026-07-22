"""
FastAPI application entry point.

Run with:
    uvicorn app.main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import communities, notes

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Community Notes API")

# Vite's default dev server port. Adjust/add origins as needed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    """Liveness check for local dev/deployment tooling."""
    return {"status": "ok"}


app.include_router(communities.router, prefix="/communities", tags=["communities"])
app.include_router(notes.router, prefix="/communities", tags=["notes"])
