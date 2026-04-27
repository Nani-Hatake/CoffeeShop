from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from ..auth import require_admin
from ..database import get_db
from ..models import Favorite, Order, User
from ..schemas import CustomerOut

router = APIRouter(prefix="/api/admin/customers", tags=["admin:customers"])


@router.get("", response_model=list[CustomerOut])
def list_customers(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    rows = (
        db.query(
            User,
            func.count(Order.id).label("order_count"),
            func.coalesce(func.sum(Order.total), 0.0).label("total_spent"),
        )
        .outerjoin(Order, Order.user_id == User.id)
        .filter(User.role == "customer")
        .group_by(User.id)
        .order_by(User.created_at.desc())
        .all()
    )
    return [
        CustomerOut(
            id=u.id, email=u.email, full_name=u.full_name, role=u.role,
            tier=u.tier, points=u.points, is_verified=u.is_verified,
            created_at=u.created_at, order_count=oc, total_spent=ts,
        )
        for u, oc, ts in rows
    ]


@router.get("/{user_id}")
def customer_detail(
    user_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")

    orders = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.user_id == user_id)
        .order_by(Order.created_at.desc())
        .all()
    )
    favorites = (
        db.query(Favorite)
        .options(joinedload(Favorite.product))
        .filter(Favorite.user_id == user_id)
        .all()
    )

    total_spent = sum(o.total for o in orders if o.status not in ("cancelled", "refunded"))
    last_order = orders[0].created_at if orders else None

    # Compute "favourite ritual" — most ordered product name
    item_counts: dict[str, int] = {}
    for o in orders:
        for it in o.items:
            item_counts[it.name] = item_counts.get(it.name, 0) + it.quantity
    top_ritual = max(item_counts.items(), key=lambda kv: kv[1])[0] if item_counts else None

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "tier": user.tier,
        "role": user.role,
        "points": user.points,
        "is_verified": user.is_verified,
        "created_at": user.created_at,
        "order_count": len(orders),
        "total_spent": round(total_spent, 2),
        "last_order_at": last_order,
        "top_ritual": top_ritual,
        "favourite_count": len(favorites),
        "recent_orders": [
            {
                "id": o.id, "code": o.code, "total": o.total,
                "status": o.status, "created_at": o.created_at,
                "item_count": sum(it.quantity for it in o.items),
            }
            for o in orders[:10]
        ],
        "favourites": [
            {
                "product_id": f.product.id,
                "name": f.product.name,
                "image_url": f.product.image_url,
            }
            for f in favorites
        ],
    }
