import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..auth import get_current_user
from ..database import get_db
from ..models import CartItem, Notification, Order, OrderItem, User
from ..schemas import CheckoutIn, OrderOut

router = APIRouter(prefix="/api/orders", tags=["orders"])

TAX_RATE = 0.08


def _new_code() -> str:
    return f"AB-{secrets.randbelow(10**6):06d}"


@router.get("", response_model=list[OrderOut])
def list_orders(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.user_id == user.id)
        .order_by(Order.created_at.desc())
        .all()
    )


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.id == order_id, Order.user_id == user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("/checkout", response_model=OrderOut, status_code=201)
def checkout(
    payload: CheckoutIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = (
        db.query(CartItem)
        .options(joinedload(CartItem.product))
        .filter(CartItem.user_id == user.id)
        .all()
    )
    if not items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    subtotal = round(sum(i.product.price * i.quantity for i in items), 2)
    tax = round(subtotal * TAX_RATE, 2)
    total = round(subtotal + tax, 2)

    order = Order(
        user_id=user.id,
        code=_new_code(),
        subtotal=subtotal,
        tax=tax,
        total=total,
        status="confirmed",
        pickup_store=payload.pickup_store,
        note=payload.note,
    )
    for ci in items:
        order.items.append(OrderItem(
            product_id=ci.product_id,
            name=ci.product.name,
            unit_price=ci.product.price,
            quantity=ci.quantity,
            size=ci.size,
            milk=ci.milk,
        ))
    db.add(order)
    # Award loyalty points (1 point per dollar) and clear cart
    user.points += int(total)
    db.query(CartItem).filter(CartItem.user_id == user.id).delete()
    db.add(Notification(
        user_id=user.id,
        title=f"Order {order.code} confirmed",
        body=f"We earmarked +{int(total)} ritual points for this order.",
        icon="check_circle",
    ))
    db.commit()
    db.refresh(order)
    return order
