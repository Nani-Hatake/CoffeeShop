from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..audit import log_action
from ..auth import require_owner
from ..database import get_db
from ..models import Category, MarginTarget, Product, Stock, User
from ..schemas import (
    MarginTargetIn, MarginTargetOut, PriceSuggestionOut, ProductIn, ProductOut,
    ProductPatch, SandboxPublishIn,
)

router = APIRouter(prefix="/api/owner/lab", tags=["owner:lab"])


# ---------- Sandbox products ----------

@router.get("/products", response_model=list[ProductOut])
def list_sandbox(_: User = Depends(require_owner), db: Session = Depends(get_db)):
    return (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.is_sandbox.is_(True))
        .order_by(Product.id.desc())
        .all()
    )


@router.post("/products", response_model=ProductOut, status_code=201)
def create_sandbox_product(
    payload: ProductIn,
    owner: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    if db.query(Product).filter(Product.slug == payload.slug).first():
        raise HTTPException(status_code=400, detail="Slug already in use")
    p = Product(**payload.model_dump(), is_sandbox=True, is_available=False)
    db.add(p)
    db.flush()
    db.add(Stock(product_id=p.id, on_hand=0, low_threshold=10))
    log_action(db, owner, "lab.create", target_type="product", target_id=p.slug,
               summary=f"Lab prototype: {p.name}")
    db.commit()
    db.refresh(p)
    return (
        db.query(Product).options(joinedload(Product.category))
        .filter(Product.id == p.id).first()
    )


@router.patch("/products/{product_id}", response_model=ProductOut)
def update_sandbox(
    product_id: int,
    patch: ProductPatch,
    owner: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p or not p.is_sandbox:
        raise HTTPException(status_code=404, detail="Sandbox product not found")
    for k, v in patch.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    log_action(db, owner, "lab.update", target_type="product", target_id=p.slug)
    db.commit()
    db.refresh(p)
    return (
        db.query(Product).options(joinedload(Product.category))
        .filter(Product.id == p.id).first()
    )


@router.post("/products/{product_id}/publish", response_model=ProductOut)
def publish_sandbox(
    product_id: int,
    payload: SandboxPublishIn,
    owner: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    p.is_sandbox = False
    p.is_available = True
    p.is_featured = payload.is_featured
    log_action(db, owner, "lab.publish", target_type="product", target_id=p.slug,
               summary=f"Published {p.name} to storefront")
    db.commit()
    db.refresh(p)
    return (
        db.query(Product).options(joinedload(Product.category))
        .filter(Product.id == p.id).first()
    )


@router.delete("/products/{product_id}", status_code=204)
def delete_sandbox(
    product_id: int,
    owner: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p or not p.is_sandbox:
        raise HTTPException(status_code=404, detail="Sandbox product not found")
    db.delete(p)
    log_action(db, owner, "lab.delete", target_type="product", target_id=product_id)
    db.commit()


# ---------- Margin targets & pricing strategy ----------

@router.get("/margins", response_model=list[MarginTargetOut])
def list_margins(_: User = Depends(require_owner), db: Session = Depends(get_db)):
    rows = (
        db.query(MarginTarget)
        .options(joinedload(MarginTarget.category))
        .all()
    )
    return [
        MarginTargetOut(
            id=m.id, category_id=m.category_id,
            category_name=m.category.name if m.category else None,
            target_pct=m.target_pct, notes=m.notes, updated_at=m.updated_at,
        ) for m in rows
    ]


@router.put("/margins", response_model=MarginTargetOut)
def upsert_margin(
    payload: MarginTargetIn,
    owner: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    existing = db.query(MarginTarget).filter(MarginTarget.category_id == payload.category_id).first()
    if existing:
        existing.target_pct = payload.target_pct
        existing.notes = payload.notes
        target = existing
    else:
        target = MarginTarget(**payload.model_dump())
        db.add(target)
    log_action(db, owner, "margin.upsert", target_type="category",
               target_id=payload.category_id, summary=f"Target {payload.target_pct}%")
    db.commit()
    db.refresh(target)
    cat = db.query(Category).filter(Category.id == target.category_id).first()
    return MarginTargetOut(
        id=target.id, category_id=target.category_id,
        category_name=cat.name if cat else None,
        target_pct=target.target_pct, notes=target.notes, updated_at=target.updated_at,
    )


@router.get("/pricing-suggestions", response_model=list[PriceSuggestionOut])
def pricing_suggestions(
    _: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """For each product, compare its current margin to the category target and
    suggest a price adjustment."""
    targets = {
        m.category_id: m.target_pct
        for m in db.query(MarginTarget).all()
    }
    out: list[PriceSuggestionOut] = []
    for p in db.query(Product).filter(Product.is_sandbox.is_(False)).all():
        if not p.cost_per_unit or p.price <= 0:
            continue
        margin = ((p.price - p.cost_per_unit) / p.price) * 100
        target = targets.get(p.category_id)
        suggestion = "ok"
        suggested = None
        if target is not None:
            # suggested_price = cost / (1 - target/100)
            target_dec = target / 100.0
            if target_dec >= 1:
                target_dec = 0.99
            suggested = round(p.cost_per_unit / (1 - target_dec), 2)
            if margin < target - 2:
                suggestion = "raise"
            elif margin > target + 5:
                suggestion = "lower"
        out.append(PriceSuggestionOut(
            product_id=p.id, name=p.name, current_price=p.price,
            cost_per_unit=p.cost_per_unit,
            current_margin_pct=round(margin, 1),
            target_margin_pct=target,
            suggested_price=suggested,
            suggestion=suggestion,
        ))
    return out
