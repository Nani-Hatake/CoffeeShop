from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from ..auth import require_owner
from ..database import get_db
from ..models import AuditLog, Expense, Order, OrderItem, Product, User
from ..schemas import AuditLogOut, InvestorReportOut

router = APIRouter(prefix="/api/owner/reports", tags=["owner:reports"])

# Customer Acquisition Cost (CAC) is hard to compute precisely from internal
# data alone. We approximate it as: marketing-category expenses / new customers.
DEFAULT_MARKETING_CATEGORY = "marketing"


@router.get("/investor", response_model=InvestorReportOut)
def investor_summary(
    days: int = Query(default=90, ge=7, le=365),
    _: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    end = datetime.utcnow()
    start = end - timedelta(days=days)

    # Sales
    paid_orders = (
        db.query(Order).options(joinedload(Order.items))
        .filter(Order.created_at >= start, Order.created_at <= end)
        .filter(Order.status.notin_(["cancelled", "refunded"])).all()
    )
    revenue = round(sum(o.total for o in paid_orders), 2)
    order_count = len(paid_orders)
    aov = round(revenue / order_count, 2) if order_count else 0.0

    # Top products
    item_totals: dict[str, dict] = {}
    for o in paid_orders:
        for it in o.items:
            t = item_totals.setdefault(it.name, {"name": it.name, "qty": 0, "revenue": 0.0})
            t["qty"] += it.quantity
            t["revenue"] += it.unit_price * it.quantity
    top_products = sorted(item_totals.values(), key=lambda x: -x["revenue"])[:5]
    for t in top_products:
        t["revenue"] = round(t["revenue"], 2)

    # Customers
    customers = (
        db.query(User).filter(User.role == "customer").all()
    )
    customer_count = len(customers)
    new_customers = sum(1 for u in customers if u.created_at >= start)

    # CAC — marketing spend / new customers
    marketing_spend = round(sum(
        e.amount for e in db.query(Expense)
        .filter(Expense.incurred_at >= start, Expense.incurred_at <= end)
        .filter(Expense.category == DEFAULT_MARKETING_CATEGORY).all()
    ), 2)
    cac = round(marketing_spend / new_customers, 2) if new_customers else 0.0

    # LTV — total spent per customer (paid only) summed across all time, averaged
    spend_by_user: dict[int, float] = {}
    for o in db.query(Order).filter(Order.status.notin_(["cancelled", "refunded"])).all():
        spend_by_user[o.user_id] = spend_by_user.get(o.user_id, 0) + o.total
    ltv = round(
        sum(spend_by_user.values()) / len(spend_by_user), 2
    ) if spend_by_user else 0.0

    cac_ltv_ratio = round(ltv / cac, 2) if cac > 0 else 0.0

    # Net profit (from finance.pnl)
    from .owner_finance import compute_pnl
    pl = compute_pnl(db, days=days)

    # Locations
    from .owner_locations import compute_compare
    locations = compute_compare(db, days=days)

    return InvestorReportOut(
        period_start=start, period_end=end,
        revenue=revenue, net_profit=pl.net_profit, net_margin_pct=pl.net_margin_pct,
        customer_count=customer_count, new_customers=new_customers,
        avg_order_value=aov, cac=cac, ltv=ltv, cac_ltv_ratio=cac_ltv_ratio,
        top_products=top_products, locations=locations,
    )


# ---------- Audit log ----------

@router.get("/audit-logs", response_model=list[AuditLogOut])
def audit_logs(
    action: Optional[str] = Query(default=None),
    target_type: Optional[str] = Query(default=None),
    limit: int = Query(default=200, ge=1, le=1000),
    _: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    q = db.query(AuditLog)
    if action:
        q = q.filter(AuditLog.action == action)
    if target_type:
        q = q.filter(AuditLog.target_type == target_type)
    return q.order_by(AuditLog.created_at.desc()).limit(limit).all()
