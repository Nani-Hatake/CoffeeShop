from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..auth import require_owner
from ..database import get_db
from ..models import Order, Shift, Staff, Store, User, WasteLog
from ..schemas import StoreCompareOut

router = APIRouter(prefix="/api/owner/locations", tags=["owner:locations"])


def compute_compare(db: Session, days: int = 30) -> list[StoreCompareOut]:
    """Side-by-side performance metrics for every atelier.

    Orders in the system have a free-text `pickup_store` field that we match
    against `Store.name`. Orders without a pickup store are bucketed as
    "Online / Delivery".
    """
    since = datetime.utcnow() - timedelta(days=days)

    stores = db.query(Store).all()
    rows: list[StoreCompareOut] = []

    paid_orders = (
        db.query(Order)
        .filter(Order.created_at >= since)
        .filter(Order.status.notin_(["cancelled", "refunded"]))
        .all()
    )

    for s in stores:
        store_orders = [o for o in paid_orders if (o.pickup_store or "").strip() == s.name]
        revenue = round(sum(o.total for o in store_orders), 2)
        order_count = len(store_orders)
        aov = round(revenue / order_count, 2) if order_count else 0.0

        # Waste — we can't tie WasteLog rows to a store; surface global waste split
        # evenly across atelier count for a rough comparable view.
        waste_total = sum(w.cost for w in db.query(WasteLog).filter(WasteLog.created_at >= since).all())
        waste_per_store = round(waste_total / max(len(stores), 1), 2)

        # Labor — sum staff hours assigned to this store * their hourly rate
        shifts = (
            db.query(Shift)
            .filter(Shift.store_id == s.id, Shift.start >= since)
            .all()
        )
        labor_cost = 0.0
        for sh in shifts:
            staff = db.query(Staff).filter(Staff.id == sh.staff_id).first()
            if staff:
                hours = max(0, (sh.end - sh.start).total_seconds() / 3600.0)
                rate = staff.hourly_rate or 0
                labor_cost += hours * rate + (sh.bonus or 0)
        labor_cost = round(labor_cost, 2)
        labor_pct = round((labor_cost / revenue) * 100, 1) if revenue > 0 else 0.0

        rows.append(StoreCompareOut(
            store_id=s.id, store_name=s.name,
            revenue=revenue, orders=order_count, avg_order_value=aov,
            waste_cost=waste_per_store, labor_cost=labor_cost, labor_pct=labor_pct,
        ))

    # "Online / Delivery" bucket
    online_orders = [o for o in paid_orders if not (o.pickup_store or "").strip()]
    if online_orders or not stores:
        revenue = round(sum(o.total for o in online_orders), 2)
        order_count = len(online_orders)
        aov = round(revenue / order_count, 2) if order_count else 0.0
        rows.append(StoreCompareOut(
            store_id=None, store_name="Online / Delivery",
            revenue=revenue, orders=order_count, avg_order_value=aov,
            waste_cost=0.0, labor_cost=0.0, labor_pct=0.0,
        ))

    return rows


@router.get("/compare", response_model=list[StoreCompareOut])
def compare(
    days: int = Query(default=30, ge=1, le=365),
    _: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    return compute_compare(db, days=days)
