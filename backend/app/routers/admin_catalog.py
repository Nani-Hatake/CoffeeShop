from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..audit import log_action
from ..auth import require_admin
from ..database import get_db
from ..models import BatchLog, Category, Product, Stock, User
from ..schemas import (
    BatchIn, BatchOut, ProductIn, ProductOut, ProductPatch,
)

router = APIRouter(prefix="/api/admin/catalog", tags=["admin:catalog"])


@router.get("/products", response_model=list[ProductOut])
def list_products(
    _: User = Depends(require_admin), db: Session = Depends(get_db)
):
    return (
        db.query(Product)
        .options(joinedload(Product.category))
        .order_by(Product.id)
        .all()
    )


@router.post("/products", response_model=ProductOut, status_code=201)
def create_product(
    payload: ProductIn,
    actor: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if db.query(Product).filter(Product.slug == payload.slug).first():
        raise HTTPException(status_code=400, detail="Slug already in use")
    product = Product(**payload.model_dump())
    db.add(product)
    db.flush()
    # Auto-create empty stock row
    db.add(Stock(product_id=product.id, on_hand=0, low_threshold=10))
    log_action(db, actor, "product.create", target_type="product",
               target_id=product.slug, summary=f"Created {product.name}")
    db.commit()
    db.refresh(product)
    return (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.id == product.id)
        .first()
    )


@router.patch("/products/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    patch: ProductPatch,
    actor: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    changes = patch.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(product, field, value)
    log_action(db, actor, "product.update", target_type="product",
               target_id=product.slug,
               summary=f"Updated {product.name} · " + ", ".join(changes.keys()))
    db.commit()
    db.refresh(product)
    return (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.id == product.id)
        .first()
    )


@router.delete("/products/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    actor: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    log_action(db, actor, "product.delete", target_type="product",
               target_id=product.slug, summary=f"Deleted {product.name}")
    db.delete(product)
    db.commit()


@router.post("/products/{product_id}/availability", response_model=ProductOut)
def toggle_availability(
    product_id: int,
    actor: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_available = not product.is_available
    state = "available" if product.is_available else "86'd"
    log_action(db, actor, "product.availability", target_type="product",
               target_id=product.slug,
               summary=f"{product.name} → {state}")
    db.commit()
    db.refresh(product)
    return (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.id == product.id)
        .first()
    )


# ---------- Batch tracking ----------

@router.get("/products/{product_id}/batches", response_model=list[BatchOut])
def list_batches(
    product_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return (
        db.query(BatchLog)
        .filter(BatchLog.product_id == product_id)
        .order_by(BatchLog.created_at.desc())
        .all()
    )


@router.post("/batches", response_model=BatchOut, status_code=201)
def create_batch(
    payload: BatchIn,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if not db.query(Product).filter(Product.id == payload.product_id).first():
        raise HTTPException(status_code=404, detail="Product not found")
    batch = BatchLog(**payload.model_dump())
    db.add(batch)
    # Increase stock by batch qty
    stock = db.query(Stock).filter(Stock.product_id == payload.product_id).first()
    if stock and payload.qty:
        stock.on_hand += payload.qty
    db.commit()
    db.refresh(batch)
    return batch


@router.delete("/batches/{batch_id}", status_code=204)
def delete_batch(
    batch_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    batch = db.query(BatchLog).filter(BatchLog.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    db.delete(batch)
    db.commit()
