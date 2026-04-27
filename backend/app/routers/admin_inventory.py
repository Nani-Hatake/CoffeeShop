from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..audit import log_action
from ..auth import require_admin
from ..database import get_db
from ..models import (
    GreenBean, Notification, Product, Stock, Supplier, User, WasteLog
)
from ..schemas import (
    GreenBeanIn, GreenBeanOut, StockOut, StockPatch,
    SupplierIn, SupplierOut, WasteIn, WasteOut,
)

router = APIRouter(prefix="/api/admin/inventory", tags=["admin:inventory"])


def _stock_with_low_flag(s: Stock) -> dict:
    return {
        "id": s.id,
        "product_id": s.product_id,
        "on_hand": s.on_hand,
        "low_threshold": s.low_threshold,
        "is_low": s.on_hand <= s.low_threshold,
        "updated_at": s.updated_at,
    }


# ---------- Stock ----------

@router.get("/stock")
def list_stock(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    rows = (
        db.query(Stock)
        .join(Product, Product.id == Stock.product_id)
        .order_by(Product.name)
        .all()
    )
    products = {p.id: p for p in db.query(Product).all()}
    out = []
    for s in rows:
        p = products.get(s.product_id)
        out.append({
            **_stock_with_low_flag(s),
            "product_name": p.name if p else None,
            "product_slug": p.slug if p else None,
            "image_url": p.image_url if p else None,
            "is_available": p.is_available if p else True,
        })
    return out


@router.patch("/stock/{product_id}", response_model=StockOut)
def update_stock(
    product_id: int,
    patch: StockPatch,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    stock = db.query(Stock).filter(Stock.product_id == product_id).first()
    if not stock:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        stock = Stock(product_id=product_id)
        db.add(stock)
        db.flush()
    if patch.on_hand is not None:
        stock.on_hand = patch.on_hand
    if patch.low_threshold is not None:
        stock.low_threshold = patch.low_threshold
    log_action(db, admin, "stock.update", target_type="product",
               target_id=product_id,
               summary=f"on_hand={stock.on_hand}, threshold={stock.low_threshold}")
    db.commit()
    db.refresh(stock)
    # Notify admin if went low
    if stock.on_hand <= stock.low_threshold:
        product = db.query(Product).filter(Product.id == product_id).first()
        db.add(Notification(
            user_id=admin.id,
            title=f"Low stock: {product.name if product else 'product'}",
            body=f"Only {stock.on_hand} units left (threshold {stock.low_threshold}).",
            icon="warning",
        ))
        db.commit()
    return _stock_with_low_flag(stock)


# ---------- Suppliers ----------

@router.get("/suppliers", response_model=list[SupplierOut])
def list_suppliers(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(Supplier).order_by(Supplier.name).all()


@router.post("/suppliers", response_model=SupplierOut, status_code=201)
def create_supplier(
    payload: SupplierIn,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    supplier = Supplier(**payload.model_dump())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier


@router.patch("/suppliers/{supplier_id}", response_model=SupplierOut)
def update_supplier(
    supplier_id: int,
    payload: SupplierIn,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    for k, v in payload.model_dump().items():
        setattr(supplier, k, v)
    db.commit()
    db.refresh(supplier)
    return supplier


@router.delete("/suppliers/{supplier_id}", status_code=204)
def delete_supplier(
    supplier_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    db.delete(supplier)
    db.commit()


# ---------- Green beans (sourcing) ----------

@router.get("/green-beans", response_model=list[GreenBeanOut])
def list_green_beans(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    rows = (
        db.query(GreenBean)
        .options(joinedload(GreenBean.supplier))
        .order_by(GreenBean.arrived_at.desc())
        .all()
    )
    return [
        GreenBeanOut(
            id=r.id, supplier_id=r.supplier_id,
            supplier_name=r.supplier.name if r.supplier else None,
            origin=r.origin, process=r.process, altitude=r.altitude,
            qty_kg=r.qty_kg, direct_trade=r.direct_trade, arrived_at=r.arrived_at,
        ) for r in rows
    ]


@router.post("/green-beans", response_model=GreenBeanOut, status_code=201)
def add_green_beans(
    payload: GreenBeanIn,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if not db.query(Supplier).filter(Supplier.id == payload.supplier_id).first():
        raise HTTPException(status_code=404, detail="Supplier not found")
    bean = GreenBean(**payload.model_dump())
    db.add(bean)
    db.commit()
    db.refresh(bean)
    sup = db.query(Supplier).filter(Supplier.id == bean.supplier_id).first()
    return GreenBeanOut(
        id=bean.id, supplier_id=bean.supplier_id,
        supplier_name=sup.name if sup else None,
        origin=bean.origin, process=bean.process, altitude=bean.altitude,
        qty_kg=bean.qty_kg, direct_trade=bean.direct_trade, arrived_at=bean.arrived_at,
    )


# ---------- Waste log ----------

@router.get("/waste", response_model=list[WasteOut])
def list_waste(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    rows = (
        db.query(WasteLog)
        .options(joinedload(WasteLog.product))
        .order_by(WasteLog.created_at.desc())
        .all()
    )
    return [
        WasteOut(
            id=r.id, product_id=r.product_id,
            product_name=r.product.name if r.product else None,
            qty=r.qty, reason=r.reason, cost=r.cost, created_at=r.created_at,
        ) for r in rows
    ]


@router.post("/waste", response_model=WasteOut, status_code=201)
def log_waste(
    payload: WasteIn,
    actor: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    waste = WasteLog(**payload.model_dump())
    db.add(waste)
    # Decrement stock if applicable
    stock = db.query(Stock).filter(Stock.product_id == payload.product_id).first()
    if stock:
        stock.on_hand = max(0, stock.on_hand - payload.qty)
    log_action(db, actor, "waste.create", target_type="product",
               target_id=payload.product_id,
               summary=f"{payload.qty}× wasted · ${payload.cost:.2f} · {payload.reason or ''}")
    db.commit()
    db.refresh(waste)
    product = db.query(Product).filter(Product.id == waste.product_id).first()
    return WasteOut(
        id=waste.id, product_id=waste.product_id,
        product_name=product.name if product else None,
        qty=waste.qty, reason=waste.reason, cost=waste.cost,
        created_at=waste.created_at,
    )
