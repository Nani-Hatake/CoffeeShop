from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Category, Product
from ..schemas import CategoryOut, ProductOut

router = APIRouter(prefix="/api", tags=["products"])


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.sort_order).all()


@router.get("/products", response_model=list[ProductOut])
def list_products(
    category: Optional[str] = Query(default=None),
    q: Optional[str] = Query(default=None),
    featured: Optional[bool] = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Product).options(joinedload(Product.category))
    if category:
        query = query.join(Category).filter(Category.slug == category)
    if featured is not None:
        query = query.filter(Product.is_featured == featured)
    if q:
        like = f"%{q.lower()}%"
        query = query.filter(or_(
            Product.name.ilike(like),
            Product.subtitle.ilike(like),
            Product.description.ilike(like),
            Product.tasting_notes.ilike(like),
            Product.origin.ilike(like),
        ))
    return query.order_by(Product.id).all()


@router.get("/products/{slug}", response_model=ProductOut)
def get_product(slug: str, db: Session = Depends(get_db)):
    product = (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(or_(Product.slug == slug, Product.id == _maybe_int(slug)))
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


def _maybe_int(value: str) -> int:
    try:
        return int(value)
    except ValueError:
        return -1
