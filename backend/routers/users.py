from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from db import SessionLocal
from models import User
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from typing import Optional

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class UserLogin(BaseModel):
    identifier: str
    password: str
    email: Optional[EmailStr] = None  # For signup

@router.post("/login", response_model=dict)
def login_or_signup(user_data: UserLogin, db: Session = Depends(get_db)):
    if "@" in user_data.identifier:
        user = db.query(User).filter(User.email == user_data.identifier).first()
    else:
        user = db.query(User).filter(User.username == user_data.identifier).first()
    if user:
        if not pwd_context.verify(user_data.password, user.password):
            raise HTTPException(status_code=400, detail="Incorrect password")
        return {
            "message": "Login successful",
            "user": {
                "user_id": user.id,
                "username": user.username,
                "email": user.email,
                "xp": user.xp,
                "currency": user.currency,
                "timezone": user.timezone,
                "show_tooltips": user.show_tooltips,
                "dark_mode": user.dark_mode,
                "skip_confirm_begin": user.skip_confirm_begin,
                "skip_confirm_end": user.skip_confirm_end
            }
        }
    else:
        if not user_data.email:
            raise HTTPException(status_code=400, detail="Email required for signup")
        hashed_password = pwd_context.hash(user_data.password)
        new_user = User(
            username=user_data.identifier,
            email=user_data.email,
            password=hashed_password
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {
            "message": "User created",
            "user": {
                "user_id": new_user.id,
                "username": new_user.username,
                "email": new_user.email,
                "xp": new_user.xp,
                "currency": new_user.currency,
                "timezone": new_user.timezone,
                "show_tooltips": new_user.show_tooltips,
                "dark_mode": new_user.dark_mode,
                "skip_confirm_begin": new_user.skip_confirm_begin,
                "skip_confirm_end": new_user.skip_confirm_end
            }
        }

@router.get("/list", response_model=list)
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [user.username for user in users]

@router.get("/{username}", response_model=dict)
def get_user(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "user_id": user.id,
        "username": user.username,
        "email": user.email,
        "xp": user.xp,
        "currency": user.currency,
        "timezone": user.timezone,
        "show_tooltips": user.show_tooltips,
        "dark_mode": user.dark_mode,
        "skip_confirm_begin": user.skip_confirm_begin,
        "skip_confirm_end": user.skip_confirm_end
    }

@router.put("/{username}/settings", response_model=dict)
def update_user_settings(username: str, settings: dict, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if "timezone" in settings:
        user.timezone = settings["timezone"]
    if "show_tooltips" in settings:
        user.show_tooltips = settings["show_tooltips"]
    if "dark_mode" in settings:
        user.dark_mode = settings["dark_mode"]
    if "skip_confirm_begin" in settings:
        user.skip_confirm_begin = settings["skip_confirm_begin"]
    if "skip_confirm_end" in settings:
        user.skip_confirm_end = settings["skip_confirm_end"]
    db.commit()
    db.refresh(user)
    return {"message": "Settings updated", "user": {
        "username": user.username,
        "timezone": user.timezone,
        "show_tooltips": user.show_tooltips,
        "dark_mode": user.dark_mode,
        "skip_confirm_begin": user.skip_confirm_begin,
        "skip_confirm_end": user.skip_confirm_end
    }}
