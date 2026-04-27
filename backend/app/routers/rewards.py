import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..auth import get_current_user
from ..database import get_db
from ..models import Notification, Redemption, Reward, User
from ..schemas import RedemptionOut, RewardOut

router = APIRouter(prefix="/api/rewards", tags=["rewards"])


@router.get("", response_model=list[RewardOut])
def list_rewards(db: Session = Depends(get_db)):
    return db.query(Reward).order_by(Reward.cost_points).all()


@router.get("/me/redemptions", response_model=list[RedemptionOut])
def list_redemptions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Redemption)
        .options(joinedload(Redemption.reward))
        .filter(Redemption.user_id == user.id)
        .order_by(Redemption.redeemed_at.desc())
        .all()
    )


@router.post("/{reward_id}/redeem", response_model=RedemptionOut, status_code=201)
def redeem(reward_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reward = db.query(Reward).filter(Reward.id == reward_id).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    if user.points < reward.cost_points:
        raise HTTPException(status_code=400, detail="Not enough ritual points")
    user.points -= reward.cost_points
    code = "".join(secrets.choice("ABCDEFGHJKLMNPQRSTUVWXYZ23456789") for _ in range(8))
    redemption = Redemption(user_id=user.id, reward_id=reward.id, code=code)
    db.add(redemption)
    db.add(Notification(
        user_id=user.id,
        title=f"Reward ready: {reward.title}",
        body=f"Show code {code} at the bar to claim it.",
        icon="local_cafe",
    ))
    db.commit()
    db.refresh(redemption)
    return (
        db.query(Redemption)
        .options(joinedload(Redemption.reward))
        .filter(Redemption.id == redemption.id)
        .first()
    )
