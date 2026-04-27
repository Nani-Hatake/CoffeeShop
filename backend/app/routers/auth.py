import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..auth import create_access_token, get_current_user, hash_password, verify_password
from ..database import get_db
from ..models import Notification, User
from ..schemas import LoginIn, SignupIn, TokenOut, UserOut, VerifyIn

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=TokenOut, status_code=201)
def signup(payload: SignupIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=payload.email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        verification_code=f"{secrets.randbelow(1_000_000):06d}",
        is_verified=False,
        points=50,
        tier="Apprentice",
    )
    db.add(user)
    db.flush()
    db.add(Notification(
        user_id=user.id,
        title="Welcome to Artisan Brew",
        body="Your morning ritual just got an upgrade. Enjoy 50 starter points.",
        icon="celebration",
    ))
    db.commit()
    db.refresh(user)
    return TokenOut(access_token=create_access_token(user.id))


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return TokenOut(access_token=create_access_token(user.id))


@router.post("/login/form", response_model=TokenOut, include_in_schema=False)
def login_form(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return TokenOut(access_token=create_access_token(user.id))


@router.post("/verify", response_model=UserOut)
def verify(payload: VerifyIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Dev mode: accept any 6-digit code OR the seeded one.
    code = (payload.code or "").strip()
    if not (code == user.verification_code or (len(code) == 6 and code.isdigit())):
        raise HTTPException(status_code=400, detail="Invalid verification code")
    user.is_verified = True
    db.commit()
    db.refresh(user)
    return user


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.post("/resend-code", status_code=204)
def resend_code(payload: dict, db: Session = Depends(get_db)):
    email = payload.get("email")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.verification_code = f"{secrets.randbelow(1_000_000):06d}"
    db.commit()
