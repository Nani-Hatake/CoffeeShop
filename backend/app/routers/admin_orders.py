from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from ..audit import log_action
from ..auth import require_admin
from ..database import get_db
from ..models import Notification, Order, User
from ..schemas import OrderStatusPatch

router = APIRouter(prefix="/api/admin/orders", tags=["admin:orders"])

ALLOWED_STATUSES = {"brewing", "ready", "collected", "cancelled", "refunded", "confirmed"}


def _serialize(o: Order) -> dict:
    return {
        "id": o.id,
        "code": o.code,
        "subtotal": o.subtotal,
        "tax": o.tax,
        "discount": o.discount or 0.0,
        "total": o.total,
        "status": o.status,
        "fulfillment": o.fulfillment or "asap",
        "pickup_store": o.pickup_store,
        "promo_code": o.promo_code,
        "note": o.note,
        "refund_reason": o.refund_reason,
        "created_at": o.created_at,
        "ready_at": o.ready_at,
        "collected_at": o.collected_at,
        "user_id": o.user_id,
        "user_email": o.user.email if o.user else None,
        "user_name": o.user.full_name if o.user else None,
        "items": [
            {
                "id": it.id, "name": it.name, "unit_price": it.unit_price,
                "quantity": it.quantity, "size": it.size, "milk": it.milk,
            }
            for it in o.items
        ],
    }


@router.get("")
def list_all_orders(
    status: Optional[str] = Query(default=None),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    q = (
        db.query(Order)
        .options(joinedload(Order.user), joinedload(Order.items))
    )
    if status:
        q = q.filter(Order.status == status)
    orders = q.order_by(Order.created_at.desc()).all()
    return [_serialize(o) for o in orders]


@router.get("/live")
def live_stream(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """In-progress orders for the operations dashboard."""
    orders = (
        db.query(Order)
        .options(joinedload(Order.user), joinedload(Order.items))
        .filter(Order.status.in_(["brewing", "ready", "confirmed"]))
        .order_by(Order.created_at.asc())
        .all()
    )
    return [_serialize(o) for o in orders]


@router.get("/{order_id}")
def get_order(
    order_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    order = (
        db.query(Order)
        .options(joinedload(Order.user), joinedload(Order.items))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return _serialize(order)


@router.patch("/{order_id}/status")
def update_status(
    order_id: int,
    patch: OrderStatusPatch,
    actor: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    order = (
        db.query(Order)
        .options(joinedload(Order.user), joinedload(Order.items))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if patch.status not in ALLOWED_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status: {patch.status}")

    order.status = patch.status
    now = datetime.utcnow()
    notification_title = None
    notification_body = None

    if patch.status == "ready":
        order.ready_at = now
        notification_title = f"Order {order.code} is ready"
        notification_body = "Pick it up at the bar — your ritual awaits."
    elif patch.status == "collected":
        order.collected_at = now
    elif patch.status in ("cancelled", "refunded"):
        order.refunded_at = now
        order.refund_reason = patch.refund_reason
        # Restore points roughly
        if order.user:
            order.user.points = max(0, order.user.points - int(order.total))
        notification_title = f"Order {order.code} {patch.status}"
        notification_body = patch.refund_reason or f"Your order has been {patch.status}."

    if notification_title and order.user:
        db.add(Notification(
            user_id=order.user_id,
            title=notification_title,
            body=notification_body,
            icon="local_cafe" if patch.status == "ready" else "info",
        ))

    log_action(db, actor, f"order.{patch.status}", target_type="order",
               target_id=order.code,
               summary=patch.refund_reason or f"Order moved to {patch.status}")

    db.commit()
    db.refresh(order)
    return _serialize(order)
