"""
backend/routers/questlogs.py
----------------------------
This router provides endpoints to manage Quest Logs (boards), including creation, deletion,
listing, invite link generation/acceptance, and fetching activity logs. All actions are logged.
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Body
from sqlalchemy.orm import Session
from ..db import SessionLocal
from ..models import QuestLog, QuestLogMembership, QuestLogInvite, QLActivity, User
from pydantic import BaseModel
from datetime import datetime, timedelta
import logging

router = APIRouter()
logger = logging.getLogger("backend-logger")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic models for input/output
class QuestLogCreate(BaseModel):
    name: str
    owner_username: str

class InviteOptions(BaseModel):
    expires_in_hours: int = None   # Optional expiration duration (e.g., 48 hrs)
    is_permanent: bool = False       # If true, link never expires

class InviteResponse(BaseModel):
    token: str
    expires_at: datetime = None

# Create a new Quest Log.
@router.post("/", response_model=dict)
def create_quest_log(ql_data: QuestLogCreate, db: Session = Depends(get_db)):
    owner = db.query(User).filter(User.username == ql_data.owner_username).first()
    if not owner:
        logger.error(f"User '{ql_data.owner_username}' not found during quest log creation.")
        raise HTTPException(status_code=404, detail="Owner user not found")
    quest_log = QuestLog(name=ql_data.name, owner_id=owner.id)
    db.add(quest_log)
    db.commit()
    db.refresh(quest_log)
    logger.info(f"Quest Log '{ql_data.name}' (ID {quest_log.id}) created by '{ql_data.owner_username}'.")
    # Automatically add the owner as a member with full permissions.
    membership = QuestLogMembership(quest_log_id=quest_log.id, user_id=owner.id, role="member")
    db.add(membership)
    db.commit()
    # Log the creation activity.
    activity = QLActivity(
        quest_log_id=quest_log.id,
        user_id=owner.id,
        action="created",
        details=f"Quest Log '{ql_data.name}' created."
    )
    db.add(activity)
    db.commit()
    return {"message": "Quest Log created", "quest_log_id": quest_log.id}

# List all Quest Logs for a given user.
@router.get("/", response_model=list)
def list_quest_logs(username: str = Query(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        logger.error(f"User '{username}' not found when listing quest logs.")
        raise HTTPException(status_code=404, detail="User not found")
    # Logs owned by the user.
    owned = db.query(QuestLog).filter(QuestLog.owner_id == user.id).all()
    # Logs where the user is a member (but not the owner).
    memberships = db.query(QuestLogMembership).filter(QuestLogMembership.user_id == user.id).all()
    member_ids = {m.quest_log_id for m in memberships}
    member_logs = db.query(QuestLog).filter(QuestLog.id.in_(member_ids), QuestLog.owner_id != user.id).all()
    all_logs = owned + member_logs
    logger.info(f"User '{username}' listed {len(all_logs)} quest logs.")
    return [
        {
            "id": ql.id,
            "name": ql.name,
            "owner_username": db.query(User).filter(User.id == ql.owner_id).first().username
        }
        for ql in all_logs
    ]

# Delete a Quest Log (owner-only).
@router.delete("/{quest_log_id}", response_model=dict)
def delete_quest_log(quest_log_id: int, username: str, db: Session = Depends(get_db)):
    quest_log = db.query(QuestLog).filter(QuestLog.id == quest_log_id).first()
    if not quest_log:
        logger.error(f"Quest Log ID {quest_log_id} not found for deletion.")
        raise HTTPException(status_code=404, detail="Quest Log not found")
    owner = db.query(User).filter(User.id == quest_log.owner_id).first()
    if owner.username != username:
        logger.warning(f"User '{username}' attempted to delete Quest Log ID {quest_log_id} not owned by them.")
        raise HTTPException(status_code=403, detail="Only the owner can delete the Quest Log")
    db.delete(quest_log)
    db.commit()
    logger.info(f"Quest Log ID {quest_log_id} deleted by owner '{username}'.")
    activity = QLActivity(
        quest_log_id=quest_log_id,
        user_id=owner.id,
        action="deleted",
        details="Quest Log deleted."
    )
    db.add(activity)
    db.commit()
    return {"message": "Quest Log deleted"}

# Generate (or regenerate) an invite link.
@router.post("/{quest_log_id}/invite", response_model=InviteResponse)
def generate_invite(quest_log_id: int, username: str, options: InviteOptions = Body(...), db: Session = Depends(get_db)):
    quest_log = db.query(QuestLog).filter(QuestLog.id == quest_log_id).first()
    if not quest_log:
        logger.error(f"Quest Log ID {quest_log_id} not found for invite generation.")
        raise HTTPException(status_code=404, detail="Quest Log not found")
    owner = db.query(User).filter(User.id == quest_log.owner_id).first()
    if owner.username != username:
        logger.warning(f"User '{username}' attempted to generate an invite for Quest Log ID {quest_log_id} they do not own.")
        raise HTTPException(status_code=403, detail="Only the owner can generate invite links")
    expires_at = None
    if options.expires_in_hours and not options.is_permanent:
        expires_at = datetime.utcnow() + timedelta(hours=options.expires_in_hours)
    invite = QuestLogInvite(quest_log_id=quest_log_id, expires_at=expires_at, is_permanent=options.is_permanent)
    db.add(invite)
    db.commit()
    db.refresh(invite)
    logger.info(f"Invite generated for Quest Log ID {quest_log_id} by '{username}'. Token: {invite.token}")
    activity = QLActivity(
        quest_log_id=quest_log_id,
        user_id=owner.id,
        action="invite_generated",
        details=f"Token: {invite.token}"
    )
    db.add(activity)
    db.commit()
    return InviteResponse(token=invite.token, expires_at=invite.expires_at)

# Accept an invite link.
class InviteAccept(BaseModel):
    token: str
    username: str
    action: str  # "join" or "spectate"

@router.post("/invite/accept", response_model=dict)
def accept_invite(data: InviteAccept, db: Session = Depends(get_db)):
    invite = db.query(QuestLogInvite).filter(QuestLogInvite.token == data.token).first()
    if not invite:
        logger.error(f"Invalid invite token: {data.token}")
        raise HTTPException(status_code=400, detail="Invalid invite token")
    if invite.expires_at and datetime.utcnow() > invite.expires_at:
        logger.warning(f"Expired invite token: {data.token}")
        raise HTTPException(status_code=400, detail="Invite token has expired")
    user = db.query(User).filter(User.username == data.username).first()
    if not user:
        logger.error(f"User '{data.username}' not found during invite acceptance.")
        raise HTTPException(status_code=404, detail="User not found")
    membership = db.query(QuestLogMembership).filter(
        QuestLogMembership.quest_log_id == invite.quest_log_id,
        QuestLogMembership.user_id == user.id
    ).first()
    if membership:
        logger.info(f"User '{data.username}' already a member/spectator of Quest Log ID {invite.quest_log_id}.")
        activity = QLActivity(
            quest_log_id=invite.quest_log_id,
            user_id=user.id,
            action="invite_revisited",
            details=f"Action: {data.action}"
        )
        db.add(activity)
        db.commit()
        return {"message": "User already a member or spectator"}
    role = "member" if data.action == "join" else "spectator"
    new_membership = QuestLogMembership(quest_log_id=invite.quest_log_id, user_id=user.id, role=role)
    db.add(new_membership)
    activity = QLActivity(
        quest_log_id=invite.quest_log_id,
        user_id=user.id,
        action="joined" if role == "member" else "spectated",
        details=f"Via invite token {data.token}"
    )
    db.add(activity)
    db.commit()
    logger.info(f"User '{data.username}' accepted invite token {data.token} as {role} for Quest Log ID {invite.quest_log_id}.")
    return {"message": f"Invite accepted; user added as {role}", "quest_log_id": invite.quest_log_id}

# Fetch activity logs for a Quest Log (with pagination).
@router.get("/{quest_log_id}/activities", response_model=list)
def get_activities(quest_log_id: int, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    activities = db.query(QLActivity).filter(QLActivity.quest_log_id == quest_log_id)\
        .order_by(QLActivity.timestamp.desc()).offset(skip).limit(limit).all()
    logger.info(f"Fetched {len(activities)} activities for Quest Log ID {quest_log_id}.")
    result = []
    for act in activities:
        result.append({
            "id": act.id,
            "user_id": act.user_id,
            "action": act.action,
            "details": act.details,
            "timestamp": act.timestamp
        })
    return result
