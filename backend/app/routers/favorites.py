from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..auth import get_current_user
from ..database import get_db
from ..models import Favorite, Product, User
from ..schemas import FavoriteOut

router = APIRouter(prefix="/api/favorites", tags=["favorites"])


@router.get("", response_model=list[FavoriteOut])
def list_favorites(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Favorite)
        .options(joinedload(Favorite.product))
        .filter(Favorite.user_id == user.id)
        .order_by(Favorite.created_at.desc())
        .all()
    )


@router.post("/{product_id}", response_model=FavoriteOut, status_code=201)
def add_favorite(product_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not db.query(Product).filter(Product.id == product_id).first():
        raise HTTPException(status_code=404, detail="Product not found")
    fav = (
        db.query(Favorite)
        .filter(Favorite.user_id == user.id, Favorite.product_id == product_id)
        .first()
    )
    if not fav:
        fav = Favorite(user_id=user.id, product_id=product_id)
        db.add(fav)
        db.commit()
        db.refresh(fav)
    return (
        db.query(Favorite)
        .options(joinedload(Favorite.product))
        .filter(Favorite.id == fav.id)
        .first()
    )


@router.delete("/{product_id}", status_code=204)
def remove_favorite(product_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    fav = (
        db.query(Favorite)
        .filter(Favorite.user_id == user.id, Favorite.product_id == product_id)
        .first()
    )
    if fav:
        db.delete(fav)
        db.commit()
