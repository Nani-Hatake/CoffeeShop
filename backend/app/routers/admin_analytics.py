from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from ..auth import require_admin
from ..database import get_db
from ..models import (
    Order, OrderItem, Product, Redemption, Reward, Stock, User, WasteLog
)

router = APIRouter(prefix="/api/admin/analytics", tags=["admin:analytics"])


@router.get("/sales")
def sales_analytics(
    period: str = Query(default="week", pattern="^(day|week|month)$"),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()
    if period == "day":
        since = now - timedelta(days=1)
        bucket = "%H:00"  # hourly
    elif period == "month":
        since = now - timedelta(days=30)
        bucket = "%Y-%m-%d"
    else:
        since = now - timedelta(days=7)
        bucket = "%Y-%m-%d"

    paid_orders = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.created_at >= since)
        .filter(Order.status.notin_(["cancelled", "refunded"]))
        .all()
    )

    total_revenue = round(sum(o.total for o in paid_orders), 2)
    total_orders = len(paid_orders)
    aov = round(total_revenue / total_orders, 2) if total_orders else 0.0

    # Series: bucket revenue by date/hour
    series_map: dict[str, dict] = {}
    for o in paid_orders:
        key = o.created_at.strftime(bucket)
        s = series_map.setdefault(key, {"label": key, "revenue": 0.0, "orders": 0})
        s["revenue"] += o.total
        s["orders"] += 1
    series = sorted(series_map.values(), key=lambda x: x["label"])
    for s in series:
        s["revenue"] = round(s["revenue"], 2)

    # Top products
    product_totals: dict[str, dict] = {}
    for o in paid_orders:
        for it in o.items:
            t = product_totals.setdefault(it.name, {"name": it.name, "qty": 0, "revenue": 0.0})
            t["qty"] += it.quantity
            t["revenue"] += it.unit_price * it.quantity
    top_products = sorted(product_totals.values(), key=lambda x: -x["revenue"])[:5]
    for t in top_products:
        t["revenue"] = round(t["revenue"], 2)

    # Peak hours
    hour_counts: dict[int, int] = {}
    for o in paid_orders:
        h = o.created_at.hour
        hour_counts[h] = hour_counts.get(h, 0) + 1
    peak_hours = [
        {"hour": h, "orders": c}
        for h, c in sorted(hour_counts.items())
    ]

    return {
        "period": period,
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "avg_order_value": aov,
        "series": series,
        "top_products": top_products,
        "peak_hours": peak_hours,
    }


@router.get("/inventory")
def inventory_analytics(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Stock, Product)
        .join(Product, Product.id == Stock.product_id)
        .all()
    )
    low_stock = []
    out_of_stock = []
    for stock, product in rows:
        item = {
            "product_id": product.id,
            "name": product.name,
            "on_hand": stock.on_hand,
            "low_threshold": stock.low_threshold,
            "image_url": product.image_url,
        }
        if stock.on_hand == 0:
            out_of_stock.append(item)
        elif stock.on_hand <= stock.low_threshold:
            low_stock.append(item)

    # Turn rate: items sold in last 30 days / current on_hand
    since = datetime.utcnow() - timedelta(days=30)
    sold_q = (
        db.query(OrderItem.product_id, func.sum(OrderItem.quantity).label("sold"))
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.created_at >= since)
        .filter(Order.status.notin_(["cancelled", "refunded"]))
        .group_by(OrderItem.product_id)
        .all()
    )
    sold_by_product = {pid: sold for pid, sold in sold_q}
    turn_rate = []
    for stock, product in rows:
        sold = sold_by_product.get(product.id, 0)
        turn_rate.append({
            "product_id": product.id,
            "name": product.name,
            "sold_30d": int(sold or 0),
            "on_hand": stock.on_hand,
            "rate": round(sold / max(stock.on_hand, 1), 2) if stock.on_hand > 0 else None,
        })
    turn_rate.sort(key=lambda x: -(x["sold_30d"] or 0))

    waste_rows = db.query(WasteLog).all()
    waste_total = round(sum(w.cost for w in waste_rows), 2)
    waste_count = len(waste_rows)

    return {
        "low_stock": low_stock,
        "out_of_stock": out_of_stock,
        "turn_rate": turn_rate[:10],
        "waste_total": waste_total,
        "waste_count": waste_count,
    }


@router.get("/loyalty")
def loyalty_analytics(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    total_points = (
        db.query(func.coalesce(func.sum(User.points), 0))
        .filter(User.role == "customer")
        .scalar() or 0
    )
    redemptions = db.query(Redemption).count()
    active_members = (
        db.query(User)
        .filter(User.role == "customer", User.points > 0)
        .count()
    )
    redemption_rate = round(redemptions / max(active_members, 1), 2)

    # Top redeemed rewards
    top_rewards = (
        db.query(Reward.title, func.count(Redemption.id).label("count"))
        .join(Redemption, Redemption.reward_id == Reward.id)
        .group_by(Reward.id)
        .order_by(func.count(Redemption.id).desc())
        .limit(5)
        .all()
    )

    return {
        "total_points_issued": int(total_points),
        "total_redemptions": redemptions,
        "redemption_rate": redemption_rate,
        "active_members": active_members,
        "top_rewards": [{"title": t, "count": c} for t, c in top_rewards],
    }


@router.get("/dashboard")
def dashboard_summary(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Top-line cards for the admin dashboard."""
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday = today - timedelta(days=1)

    today_orders = (
        db.query(Order)
        .filter(Order.created_at >= today)
        .filter(Order.status.notin_(["cancelled", "refunded"]))
        .all()
    )
    yesterday_orders = (
        db.query(Order)
        .filter(Order.created_at >= yesterday, Order.created_at < today)
        .filter(Order.status.notin_(["cancelled", "refunded"]))
        .all()
    )

    today_rev = round(sum(o.total for o in today_orders), 2)
    yesterday_rev = round(sum(o.total for o in yesterday_orders), 2)

    in_progress = db.query(Order).filter(Order.status.in_(["brewing", "confirmed"])).count()
    ready = db.query(Order).filter(Order.status == "ready").count()
    customers = db.query(User).filter(User.role == "customer").count()

    return {
        "today_revenue": today_rev,
        "yesterday_revenue": yesterday_rev,
        "today_orders": len(today_orders),
        "yesterday_orders": len(yesterday_orders),
        "in_progress": in_progress,
        "ready_pickup": ready,
        "total_customers": customers,
    }
