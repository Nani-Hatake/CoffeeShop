from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..auth import get_current_user
from ..database import get_db
from ..models import Product, Subscription, User
from ..schemas import SubscriptionIn, SubscriptionOut

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])

CADENCE_DAYS = {"weekly": 7, "biweekly": 14, "monthly": 30}


@router.get("", response_model=list[SubscriptionOut])
def list_subscriptions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Subscription)
        .options(joinedload(Subscription.product))
        .filter(Subscription.user_id == user.id)
        .order_by(Subscription.created_at.desc())
        .all()
    )


@router.post("", response_model=SubscriptionOut, status_code=201)
def create_subscription(
    payload: SubscriptionIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not db.query(Product).filter(Product.id == payload.product_id).first():
        raise HTTPException(status_code=404, detail="Product not found")
    days = CADENCE_DAYS.get(payload.cadence, 7)
    sub = Subscription(
        user_id=user.id,
        product_id=payload.product_id,
        cadence=payload.cadence,
        quantity=payload.quantity,
        next_delivery=datetime.utcnow() + timedelta(days=days),
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return (
        db.query(Subscription)
        .options(joinedload(Subscription.product))
        .filter(Subscription.id == sub.id)
        .first()
    )


@router.delete("/{sub_id}", status_code=204)
def cancel(sub_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sub = (
        db.query(Subscription)
        .filter(Subscription.id == sub_id, Subscription.user_id == user.id)
        .first()
    )
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    sub.active = False
    db.commit()
