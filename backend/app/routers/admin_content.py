from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import require_admin
from ..database import get_db
from ..models import JournalEntry, User
from ..schemas import JournalEntryIn, JournalEntryOut

router = APIRouter(prefix="/api/admin/content", tags=["admin:content"])


@router.get("/journal", response_model=list[JournalEntryOut])
def list_journal(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(JournalEntry).order_by(JournalEntry.created_at.desc()).all()


@router.post("/journal", response_model=JournalEntryOut, status_code=201)
def create_entry(
    payload: JournalEntryIn,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if db.query(JournalEntry).filter(JournalEntry.slug == payload.slug).first():
        raise HTTPException(status_code=400, detail="Slug already exists")
    data = payload.model_dump()
    if data["published"]:
        data["published_at"] = datetime.utcnow()
    entry = JournalEntry(**data)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.patch("/journal/{entry_id}", response_model=JournalEntryOut)
def update_entry(
    entry_id: int,
    payload: JournalEntryIn,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    entry = db.query(JournalEntry).filter(JournalEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    was_published = entry.published
    for k, v in payload.model_dump().items():
        setattr(entry, k, v)
    # Stamp published_at on transition draft -> published
    if entry.published and not was_published:
        entry.published_at = datetime.utcnow()
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/journal/{entry_id}", status_code=204)
def delete_entry(
    entry_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    entry = db.query(JournalEntry).filter(JournalEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(entry)
    db.commit()


# ---------- Public-facing journal feed (no auth required) ----------

public_router = APIRouter(prefix="/api/journal", tags=["journal"])


@public_router.get("", response_model=list[JournalEntryOut])
def public_list(db: Session = Depends(get_db)):
    return (
        db.query(JournalEntry)
        .filter(JournalEntry.published.is_(True))
        .order_by(JournalEntry.published_at.desc())
        .all()
    )


@public_router.get("/{slug}", response_model=JournalEntryOut)
def public_detail(slug: str, db: Session = Depends(get_db)):
    entry = (
        db.query(JournalEntry)
        .filter(JournalEntry.slug == slug, JournalEntry.published.is_(True))
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry
