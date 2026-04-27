from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..auth import get_current_user
from ..database import get_db
from ..models import CartItem, Product, User
from ..schemas import CartItemIn, CartItemOut, CartItemPatch, CartOut

router = APIRouter(prefix="/api/cart", tags=["cart"])

TAX_RATE = 0.08


def _serialize_cart(items: list[CartItem]) -> CartOut:
    line_items = []
    subtotal = 0.0
    for ci in items:
        line_total = round(ci.product.price * ci.quantity, 2)
        subtotal += line_total
        line_items.append(CartItemOut(
            id=ci.id,
            product=ci.product,
            quantity=ci.quantity,
            size=ci.size,
            milk=ci.milk,
            notes=ci.notes,
            line_total=line_total,
        ))
    subtotal = round(subtotal, 2)
    tax = round(subtotal * TAX_RATE, 2)
    total = round(subtotal + tax, 2)
    return CartOut(items=line_items, subtotal=subtotal, tax=tax, total=total)


@router.get("", response_model=CartOut)
def get_cart(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = (
        db.query(CartItem)
        .options(joinedload(CartItem.product))
        .filter(CartItem.user_id == user.id)
        .order_by(CartItem.id)
        .all()
    )
    return _serialize_cart(items)


@router.post("/items", response_model=CartOut, status_code=201)
def add_item(
    payload: CartItemIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing = (
        db.query(CartItem)
        .filter(
            CartItem.user_id == user.id,
            CartItem.product_id == payload.product_id,
            CartItem.size == payload.size,
            CartItem.milk == payload.milk,
        )
        .first()
    )
    if existing:
        existing.quantity = min(20, existing.quantity + payload.quantity)
        if payload.notes:
            existing.notes = payload.notes
    else:
        db.add(CartItem(
            user_id=user.id,
            product_id=payload.product_id,
            quantity=payload.quantity,
            size=payload.size,
            milk=payload.milk,
            notes=payload.notes,
        ))
    db.commit()
    return get_cart(user, db)


@router.patch("/items/{item_id}", response_model=CartOut)
def update_item(
    item_id: int,
    patch: CartItemPatch,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = (
        db.query(CartItem)
        .filter(CartItem.id == item_id, CartItem.user_id == user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    if patch.quantity is not None:
        item.quantity = patch.quantity
    if patch.size is not None:
        item.size = patch.size
    if patch.milk is not None:
        item.milk = patch.milk
    if patch.notes is not None:
        item.notes = patch.notes
    db.commit()
    return get_cart(user, db)


@router.delete("/items/{item_id}", response_model=CartOut)
def delete_item(
    item_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = (
        db.query(CartItem)
        .filter(CartItem.id == item_id, CartItem.user_id == user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    db.delete(item)
    db.commit()
    return get_cart(user, db)


@router.delete("", response_model=CartOut)
def clear_cart(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(CartItem).filter(CartItem.user_id == user.id).delete()
    db.commit()
    return get_cart(user, db)
