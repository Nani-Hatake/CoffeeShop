from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import require_admin, require_owner
from ..database import get_db
from ..models import LoyaltyRule, Promotion, User
from ..schemas import (
    LoyaltyRuleOut, LoyaltyRulePatch, PromotionIn, PromotionOut,
)

router = APIRouter(prefix="/api/admin/marketing", tags=["admin:marketing"])


# ---------- Promotion engine ----------

@router.get("/promotions", response_model=list[PromotionOut])
def list_promotions(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(Promotion).order_by(Promotion.created_at.desc()).all()


@router.post("/promotions", response_model=PromotionOut, status_code=201)
def create_promotion(
    payload: PromotionIn,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    code = payload.code.upper().strip()
    if db.query(Promotion).filter(Promotion.code == code).first():
        raise HTTPException(status_code=400, detail="Promotion code already exists")
    promo = Promotion(**{**payload.model_dump(), "code": code})
    db.add(promo)
    db.commit()
    db.refresh(promo)
    return promo


@router.patch("/promotions/{promo_id}", response_model=PromotionOut)
def update_promotion(
    promo_id: int,
    payload: PromotionIn,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    promo = db.query(Promotion).filter(Promotion.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promotion not found")
    for k, v in payload.model_dump().items():
        setattr(promo, k, v.upper().strip() if k == "code" and isinstance(v, str) else v)
    db.commit()
    db.refresh(promo)
    return promo


@router.delete("/promotions/{promo_id}", status_code=204)
def delete_promotion(
    promo_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    promo = db.query(Promotion).filter(Promotion.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promotion not found")
    db.delete(promo)
    db.commit()


# ---------- Loyalty rules (owner-only) ----------

def _rules_singleton(db: Session) -> LoyaltyRule:
    rule = db.query(LoyaltyRule).first()
    if not rule:
        rule = LoyaltyRule()
        db.add(rule)
        db.commit()
        db.refresh(rule)
    return rule


@router.get("/loyalty-rules", response_model=LoyaltyRuleOut)
def get_rules(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    return _rules_singleton(db)


@router.patch("/loyalty-rules", response_model=LoyaltyRuleOut)
def update_rules(
    patch: LoyaltyRulePatch,
    _: User = Depends(require_owner),  # Only owner can change financial loyalty rules
    db: Session = Depends(get_db),
):
    rule = _rules_singleton(db)
    for k, v in patch.model_dump(exclude_unset=True).items():
        setattr(rule, k, v)
    db.commit()
    db.refresh(rule)
    return rule
