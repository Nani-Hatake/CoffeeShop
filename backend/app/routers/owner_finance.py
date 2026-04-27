from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from ..audit import log_action
from ..auth import require_owner
from ..database import get_db
from ..models import (
    Expense, Order, OrderItem, Product, Shift, Staff, TaxSetting, User,
)
from ..schemas import (
    ExpenseIn, ExpenseOut, PnLOut, TaxSettingOut, TaxSettingPatch,
)

router = APIRouter(prefix="/api/owner/finance", tags=["owner:finance"])


# ---------- Expenses ----------

@router.get("/expenses", response_model=list[ExpenseOut])
def list_expenses(_: User = Depends(require_owner), db: Session = Depends(get_db)):
    return db.query(Expense).order_by(Expense.incurred_at.desc()).all()


@router.post("/expenses", response_model=ExpenseOut, status_code=201)
def add_expense(
    payload: ExpenseIn,
    owner: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    data = payload.model_dump()
    if not data.get("incurred_at"):
        data["incurred_at"] = datetime.utcnow()
    e = Expense(**data)
    db.add(e)
    log_action(db, owner, "expense.create", target_type="expense",
               summary=f"${payload.amount} · {payload.category}")
    db.commit()
    db.refresh(e)
    return e


@router.delete("/expenses/{expense_id}", status_code=204)
def delete_expense(
    expense_id: int,
    owner: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    e = db.query(Expense).filter(Expense.id == expense_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(e)
    log_action(db, owner, "expense.delete", target_type="expense", target_id=expense_id)
    db.commit()


# ---------- Tax / Compliance ----------

def _tax_singleton(db: Session) -> TaxSetting:
    tax = db.query(TaxSetting).first()
    if not tax:
        tax = TaxSetting()
        db.add(tax)
        db.commit()
        db.refresh(tax)
    return tax


@router.get("/tax", response_model=TaxSettingOut)
def get_tax(_: User = Depends(require_owner), db: Session = Depends(get_db)):
    return _tax_singleton(db)


@router.patch("/tax", response_model=TaxSettingOut)
def update_tax(
    patch: TaxSettingPatch,
    owner: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    tax = _tax_singleton(db)
    for k, v in patch.model_dump(exclude_unset=True).items():
        setattr(tax, k, v)
    log_action(db, owner, "tax.update", target_type="tax", target_id=tax.id)
    db.commit()
    db.refresh(tax)
    return tax


# ---------- Profit & Loss ----------

def compute_pnl(db: Session, days: int = 30) -> PnLOut:
    end = datetime.utcnow()
    start = end - timedelta(days=days)

    # Revenue
    paid_orders = (
        db.query(Order).options(joinedload(Order.items))
        .filter(Order.created_at >= start, Order.created_at <= end)
        .all()
    )
    gross_revenue = round(sum(o.total for o in paid_orders if o.status not in ["cancelled", "refunded"]), 2)
    refunds = round(sum(o.total for o in paid_orders if o.status in ["cancelled", "refunded"]), 2)
    net_revenue = round(gross_revenue, 2)

    # COGS — uses Product.cost_per_unit per OrderItem
    items = (
        db.query(OrderItem, Product)
        .join(Order, Order.id == OrderItem.order_id)
        .join(Product, Product.id == OrderItem.product_id)
        .filter(Order.created_at >= start, Order.created_at <= end)
        .filter(Order.status.notin_(["cancelled", "refunded"]))
        .all()
    )
    cogs = round(sum((p.cost_per_unit or 0) * it.quantity for it, p in items), 2)

    gross_profit = round(net_revenue - cogs, 2)
    gross_margin_pct = round((gross_profit / net_revenue) * 100, 1) if net_revenue > 0 else 0.0

    # Labor (gross pay) — call into the workforce computation
    from .owner_workforce import _compute_payroll
    payroll = _compute_payroll(db, start, end)
    labor = round(payroll.total_gross, 2)

    # Overhead
    expenses = (
        db.query(Expense)
        .filter(Expense.incurred_at >= start, Expense.incurred_at <= end)
        .all()
    )
    overhead = round(sum(e.amount for e in expenses), 2)
    by_category: dict[str, float] = {}
    for e in expenses:
        by_category[e.category] = by_category.get(e.category, 0) + e.amount
    breakdown = [{"category": k, "amount": round(v, 2)} for k, v in sorted(by_category.items(), key=lambda kv: -kv[1])]

    operating_expenses = round(labor + overhead, 2)
    net_profit = round(gross_profit - operating_expenses, 2)
    net_margin_pct = round((net_profit / net_revenue) * 100, 1) if net_revenue > 0 else 0.0

    return PnLOut(
        period_start=start, period_end=end,
        gross_revenue=gross_revenue, refunds=refunds, net_revenue=net_revenue,
        cogs=cogs, gross_profit=gross_profit, gross_margin_pct=gross_margin_pct,
        labor=labor, overhead=overhead, operating_expenses=operating_expenses,
        net_profit=net_profit, net_margin_pct=net_margin_pct,
        expense_breakdown=breakdown,
    )


@router.get("/pnl", response_model=PnLOut)
def pnl(
    days: int = Query(default=30, ge=1, le=365),
    _: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    return compute_pnl(db, days=days)
