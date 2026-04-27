from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from ..audit import log_action
from ..auth import require_owner
from ..database import get_db
from ..models import Order, PerformanceReview, Shift, Staff, Store, User
from ..schemas import (
    PayrollLineOut, PayrollSummaryOut, PerformanceReviewIn, PerformanceReviewOut,
    ShiftIn, ShiftOut, StaffIn, StaffOut,
)

router = APIRouter(prefix="/api/owner/workforce", tags=["owner:workforce"])


def _staff_to_out(s: Staff) -> StaffOut:
    return StaffOut(
        id=s.id, user_id=s.user_id, full_name=s.full_name, email=s.email,
        phone=s.phone, position=s.position, employment_type=s.employment_type,
        hourly_rate=s.hourly_rate, monthly_salary=s.monthly_salary,
        overtime_multiplier=s.overtime_multiplier, bank_account=s.bank_account,
        store_id=s.store_id,
        store_name=s.store.name if s.store else None,
        certifications=s.certifications, health_permit_expires=s.health_permit_expires,
        hire_date=s.hire_date, active=s.active, notes=s.notes,
    )


def _shift_hours(start: datetime, end: datetime) -> float:
    delta = (end - start).total_seconds() / 3600.0
    return round(max(0.0, delta), 2)


# ---------- Staff ----------

@router.get("/staff", response_model=list[StaffOut])
def list_staff(owner: User = Depends(require_owner), db: Session = Depends(get_db)):
    rows = db.query(Staff).options(joinedload(Staff.store)).order_by(Staff.full_name).all()
    return [_staff_to_out(s) for s in rows]


@router.get("/staff/{staff_id}")
def staff_detail(
    staff_id: int,
    owner: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    s = db.query(Staff).options(joinedload(Staff.store)).filter(Staff.id == staff_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Staff member not found")
    shifts = (
        db.query(Shift).filter(Shift.staff_id == staff_id)
        .order_by(Shift.start.desc()).limit(20).all()
    )
    reviews = (
        db.query(PerformanceReview).filter(PerformanceReview.staff_id == staff_id)
        .order_by(PerformanceReview.created_at.desc()).all()
    )
    total_hours_30d = sum(
        _shift_hours(sh.start, sh.end)
        for sh in shifts
        if sh.start >= datetime.utcnow() - timedelta(days=30)
    )
    return {
        **_staff_to_out(s).model_dump(),
        "shifts": [{
            "id": sh.id, "start": sh.start, "end": sh.end,
            "hours": _shift_hours(sh.start, sh.end),
            "role": sh.role, "bonus": sh.bonus,
            "store_name": sh.store.name if sh.store else None,
        } for sh in shifts],
        "reviews": [{
            "id": r.id, "reviewer": r.reviewer, "rating": r.rating,
            "summary": r.summary, "created_at": r.created_at,
        } for r in reviews],
        "hours_last_30d": round(total_hours_30d, 1),
    }


@router.post("/staff", response_model=StaffOut, status_code=201)
def enroll_staff(
    payload: StaffIn,
    owner: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    if db.query(Staff).filter(Staff.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Staff with this email already exists")
    s = Staff(**payload.model_dump())
    db.add(s)
    log_action(db, owner, "staff.enroll", target_type="staff", target_id=payload.email,
               summary=f"Enrolled {payload.full_name} as {payload.position}")
    db.commit()
    db.refresh(s)
    return _staff_to_out(s)


@router.patch("/staff/{staff_id}", response_model=StaffOut)
def update_staff(
    staff_id: int,
    payload: StaffIn,
    owner: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    s = db.query(Staff).filter(Staff.id == staff_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Staff member not found")
    for k, v in payload.model_dump().items():
        setattr(s, k, v)
    log_action(db, owner, "staff.update", target_type="staff", target_id=s.id,
               summary=f"Updated {s.full_name}")
    db.commit()
    db.refresh(s)
    return _staff_to_out(s)


@router.delete("/staff/{staff_id}", status_code=204)
def offboard_staff(
    staff_id: int,
    owner: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    s = db.query(Staff).filter(Staff.id == staff_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Staff member not found")
    s.active = False
    log_action(db, owner, "staff.offboard", target_type="staff", target_id=s.id,
               summary=f"Marked {s.full_name} inactive")
    db.commit()


# ---------- Reviews ----------

@router.post("/reviews", response_model=PerformanceReviewOut, status_code=201)
def add_review(
    payload: PerformanceReviewIn,
    owner: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    if not db.query(Staff).filter(Staff.id == payload.staff_id).first():
        raise HTTPException(status_code=404, detail="Staff member not found")
    review = PerformanceReview(**payload.model_dump())
    if not review.reviewer:
        review.reviewer = owner.full_name or owner.email
    db.add(review)
    log_action(db, owner, "review.create", target_type="staff",
               target_id=payload.staff_id, summary=f"Filed performance review")
    db.commit()
    db.refresh(review)
    return review


# ---------- Shifts ----------

@router.get("/shifts", response_model=list[ShiftOut])
def list_shifts(
    staff_id: Optional[int] = Query(default=None),
    days: int = Query(default=14, ge=1, le=90),
    owner: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    since = datetime.utcnow() - timedelta(days=days)
    q = db.query(Shift).options(joinedload(Shift.staff), joinedload(Shift.store)).filter(Shift.start >= since)
    if staff_id:
        q = q.filter(Shift.staff_id == staff_id)
    rows = q.order_by(Shift.start.desc()).all()
    return [
        ShiftOut(
            id=r.id, staff_id=r.staff_id,
            staff_name=r.staff.full_name if r.staff else None,
            store_id=r.store_id,
            store_name=r.store.name if r.store else None,
            start=r.start, end=r.end, role=r.role, bonus=r.bonus,
            hours=_shift_hours(r.start, r.end),
        ) for r in rows
    ]


@router.post("/shifts", response_model=ShiftOut, status_code=201)
def schedule_shift(
    payload: ShiftIn,
    owner: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    if not db.query(Staff).filter(Staff.id == payload.staff_id).first():
        raise HTTPException(status_code=404, detail="Staff member not found")
    if payload.end <= payload.start:
        raise HTTPException(status_code=400, detail="Shift end must be after start")
    shift = Shift(**payload.model_dump())
    db.add(shift)
    log_action(db, owner, "shift.create", target_type="shift", target_id=payload.staff_id,
               summary=f"{_shift_hours(payload.start, payload.end)}h shift")
    db.commit()
    db.refresh(shift)
    s = db.query(Staff).filter(Staff.id == shift.staff_id).first()
    st = db.query(Store).filter(Store.id == shift.store_id).first() if shift.store_id else None
    return ShiftOut(
        id=shift.id, staff_id=shift.staff_id,
        staff_name=s.full_name if s else None,
        store_id=shift.store_id, store_name=st.name if st else None,
        start=shift.start, end=shift.end, role=shift.role, bonus=shift.bonus,
        hours=_shift_hours(shift.start, shift.end),
    )


@router.delete("/shifts/{shift_id}", status_code=204)
def remove_shift(
    shift_id: int,
    owner: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    sh = db.query(Shift).filter(Shift.id == shift_id).first()
    if not sh:
        raise HTTPException(status_code=404, detail="Shift not found")
    db.delete(sh)
    log_action(db, owner, "shift.delete", target_type="shift", target_id=shift_id)
    db.commit()


# ---------- Payroll ----------

OT_THRESHOLD_PER_WEEK = 40.0


def _compute_payroll(db: Session, period_start: datetime, period_end: datetime) -> PayrollSummaryOut:
    staff_rows = db.query(Staff).filter(Staff.active.is_(True)).all()
    shifts = (
        db.query(Shift)
        .filter(Shift.start >= period_start, Shift.end <= period_end)
        .all()
    )
    shifts_by_staff: dict[int, list[Shift]] = {}
    for sh in shifts:
        shifts_by_staff.setdefault(sh.staff_id, []).append(sh)

    revenue = sum(
        o.total for o in db.query(Order)
        .filter(Order.created_at >= period_start, Order.created_at <= period_end)
        .filter(Order.status.notin_(["cancelled", "refunded"])).all()
    )
    revenue = round(revenue, 2)

    weeks_in_period = max(1, ((period_end - period_start).days + 1) / 7.0)

    lines: list[PayrollLineOut] = []
    total_gross = 0.0
    total_net = 0.0
    total_hours = 0.0
    total_ot = 0.0

    # Tax rate (applied to gross to estimate net) — owner-controlled
    from .. import models  # avoid circular at module import
    tax = db.query(models.TaxSetting).first()
    tax_rate = tax.tax_rate if tax else 8.0
    net_factor = 1 - (tax_rate / 100.0)

    for s in staff_rows:
        sh_list = shifts_by_staff.get(s.id, [])
        worked = sum(_shift_hours(sh.start, sh.end) for sh in sh_list)
        bonus = sum(sh.bonus or 0 for sh in sh_list)

        if s.employment_type == "salaried":
            base = round(s.monthly_salary * ((period_end - period_start).days / 30.0), 2)
            hours_regular = worked
            hours_overtime = 0.0
            base_pay = base
            ot_pay = 0.0
        else:
            ot_cap = OT_THRESHOLD_PER_WEEK * weeks_in_period
            hours_regular = min(worked, ot_cap)
            hours_overtime = max(0.0, worked - ot_cap)
            base_pay = round(hours_regular * (s.hourly_rate or 0), 2)
            ot_pay = round(hours_overtime * (s.hourly_rate or 0) * (s.overtime_multiplier or 1.5), 2)

        gross = round(base_pay + ot_pay + bonus, 2)
        net = round(gross * net_factor, 2)

        total_gross += gross
        total_net += net
        total_hours += worked
        total_ot += hours_overtime

        lines.append(PayrollLineOut(
            staff_id=s.id, full_name=s.full_name, position=s.position,
            employment_type=s.employment_type,
            hours_regular=round(hours_regular, 2),
            hours_overtime=round(hours_overtime, 2),
            base_pay=base_pay, overtime_pay=ot_pay, bonus=round(bonus, 2),
            gross=gross, net=net,
        ))

    labor_pct = round((total_gross / revenue) * 100, 1) if revenue > 0 else 0.0

    return PayrollSummaryOut(
        period_start=period_start, period_end=period_end,
        total_gross=round(total_gross, 2),
        total_net=round(total_net, 2),
        total_hours=round(total_hours, 1),
        total_overtime=round(total_ot, 1),
        revenue=revenue, labor_pct=labor_pct, lines=lines,
    )


@router.get("/payroll", response_model=PayrollSummaryOut)
def payroll_summary(
    days: int = Query(default=14, ge=1, le=120),
    owner: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    end = datetime.utcnow()
    start = end - timedelta(days=days)
    return _compute_payroll(db, start, end)
