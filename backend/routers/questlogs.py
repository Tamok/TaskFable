"""
Questlogs Router
----------------
This router provides endpoints for managing Quest Logs (boards),
including creation, deletion, invite link generation/acceptance, listing
activity, invites, and participants. All endpoints log actions and return
human-readable messages where applicable.
"""

from fastapi import APIRouter, HTTPException, Body, Depends, Query, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging
from pydantic import BaseModel
from typing import Optional

from ..db import SessionLocal
from ..models import QuestLog, QuestLogMembership, QuestLogInvite, QLActivity, User

router = APIRouter()
logger = logging.getLogger("backend-logger")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------------
# Pydantic Models
# -------------------------------
class QuestLogCreate(BaseModel):
    name: str
    owner_username: str

class InviteOptions(BaseModel):
    expires_in_hours: Optional[int] = None  # Optional for permanent invites.
    is_permanent: bool = False

class InviteResponse(BaseModel):
    token: str
    expires_at: Optional[datetime] = None

class InviteAccept(BaseModel):
    token: str
    username: str
    action: str  # "join" or "spectate"

# -------------------------------
# Endpoints
# -------------------------------

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
    membership = QuestLogMembership(quest_log_id=quest_log.id, user_id=owner.id, role="member")
    db.add(membership)
    db.commit()
    activity = QLActivity(
        quest_log_id=quest_log.id,
        user_id=owner.id,
        action="created",
        details=f"Quest Log '{ql_data.name}' created by {owner.username}"
    )
    db.add(activity)
    db.commit()
    return {"message": "Quest Log created", "quest_log_id": quest_log.id}

@router.get("/", response_model=list)
def list_quest_logs(username: str = Query(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        logger.error(f"User '{username}' not found when listing quest logs.")
        raise HTTPException(status_code=404, detail="User not found")
    owned = db.query(QuestLog).filter(QuestLog.owner_id == user.id).all()
    memberships = db.query(QuestLogMembership).filter(QuestLogMembership.user_id == user.id).all()
    member_ids = {m.quest_log_id for m in memberships if m.quest_log_id}
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
    if options.is_permanent and options.expires_in_hours:
        logger.error("Permanent invite cannot have an expiry time")
        raise HTTPException(status_code=400, detail="Permanent invite cannot have an expiry time")
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
        details=f"Invite generated by {owner.username}"
    )
    db.add(activity)
    db.commit()
    return InviteResponse(token=invite.token, expires_at=invite.expires_at)

@router.get("/invite/accept", response_class=RedirectResponse)
def invite_accept_get(token: str, request: Request):
    logger.info(f"GET invite accept called with token {token}")
    # Use the request host and scheme to build the frontend URL.
    host = request.headers.get("host", "localhost")
    scheme = request.url.scheme
    # For development, if backend is on :8000 assume frontend on :3000.
    if ":8000" in host:
        frontend_host = host.replace(":8000", ":3000")
    else:
        frontend_host = host
    frontend_url = f"{scheme}://{frontend_host}"
    return RedirectResponse(url=f"{frontend_url}/?invite_token={token}")

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
        logger.info(f"User '{data.username}' already a member of Quest Log ID {invite.quest_log_id}.")
        activity = QLActivity(
            quest_log_id=invite.quest_log_id,
            user_id=user.id,
            action="invite_revisited",
            details=f"Invite revisited by {data.username}"
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
        details=f"Accepted invite with token {data.token}"
    )
    db.add(activity)
    # Single-use: revoke invite after acceptance.
    invite.revoked = True
    db.commit()
    logger.info(f"User '{data.username}' accepted invite token {data.token} as {role} for Quest Log ID {invite.quest_log_id}. Invite now revoked.")
    return {"message": f"Invite accepted; user added as {role}", "quest_log_id": invite.quest_log_id}

@router.get("/{quest_log_id}/activities", response_model=list)
def get_activities(quest_log_id: int, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    activities = db.query(QLActivity).filter(QLActivity.quest_log_id == quest_log_id)\
        .order_by(QLActivity.timestamp.desc()).offset(skip).limit(limit).all()
    logger.info(f"Fetched {len(activities)} activities for Quest Log ID {quest_log_id}.")
    result = []
    for act in activities:
        user_obj = db.query(User).filter(User.id == act.user_id).first() if act.user_id else None
        username = user_obj.username if user_obj else "Unknown"
        action_map = {
            "created": "Created",
            "deleted": "Deleted",
            "invite_generated": "Invite Generated",
            "invite_revoked": "Invite Revoked",
            "joined": "Joined",
            "spectated": "Spectated",
            "invite_revisited": "Invite Revisited"
        }
        human_action = action_map.get(act.action, act.action)
        result.append({
            "id": act.id,
            "username": username,
            "action": human_action,
            "details": act.details,
            "timestamp": act.timestamp
        })
    # Sort so most recent is first.
    result.sort(key=lambda x: x["timestamp"], reverse=True)
    # If the only activity is a deletion, return an empty log.
    if len(result) == 1 and result[0]["action"].lower() == "deleted":
        result = []
    return result

@router.get("/{quest_log_id}/invites", response_model=list)
def get_invites(quest_log_id: int, db: Session = Depends(get_db)):
    invites = db.query(QuestLogInvite).filter(QuestLogInvite.quest_log_id == quest_log_id).all()
    result = []
    for inv in invites:
        if inv.revoked:
            status = "Revoked"
        elif inv.expires_at and datetime.utcnow() > inv.expires_at:
            status = "Expired"
        elif inv.is_permanent:
            status = "Permanent"
        elif inv.expires_at:
            hours = round((inv.expires_at - datetime.utcnow()).total_seconds() / 3600, 1)
            status = f"{hours} hours remaining"
        else:
            status = "Active"
        result.append({
            "id": inv.id,
            "token": inv.token,
            "is_permanent": inv.is_permanent,
            "expires_at": inv.expires_at,
            "created_at": inv.created_at,
            "revoked": inv.revoked,
            "status": status
        })
    # Sort invites by created_at descending.
    result.sort(key=lambda x: x["created_at"], reverse=True)
    logger.info(f"Returning {len(result)} invites for Quest Log ID {quest_log_id}.")
    return result

@router.get("/{quest_log_id}/participants", response_model=list)
def get_participants(quest_log_id: int, db: Session = Depends(get_db)):
    memberships = db.query(QuestLogMembership).filter(QuestLogMembership.quest_log_id == quest_log_id).all()
    participants = []
    for membership in memberships:
        user_obj = db.query(User).filter(User.id == membership.user_id).first()
        if user_obj:
            participants.append({
                "user_id": user_obj.id,
                "username": user_obj.username,
                "role": membership.role,
                "joined_at": membership.joined_at
            })
    logger.info(f"Returning {len(participants)} participants for Quest Log ID {quest_log_id}.")
    return participants

@router.delete("/{quest_log_id}/invites/{invite_id}", response_model=dict)
def revoke_invite(quest_log_id: int, invite_id: int, username: str, db: Session = Depends(get_db)):
    """
    Revoke a single-use invite link.
    Only the board owner can revoke an invite.
    """
    quest_log = db.query(QuestLog).filter(QuestLog.id == quest_log_id).first()
    if not quest_log:
        logger.error(f"Quest Log ID {quest_log_id} not found for invite revocation.")
        raise HTTPException(status_code=404, detail="Quest Log not found")
    owner = db.query(User).filter(User.id == quest_log.owner_id).first()
    if owner.username != username:
        logger.warning(f"User '{username}' is not authorized to revoke invites for Quest Log ID {quest_log_id}.")
        raise HTTPException(status_code=403, detail="Only the owner can revoke invites")
    invite = db.query(QuestLogInvite).filter(QuestLogInvite.id == invite_id, QuestLogInvite.quest_log_id == quest_log_id).first()
    if not invite:
        logger.error(f"Invite ID {invite_id} not found for Quest Log ID {quest_log_id}.")
        raise HTTPException(status_code=404, detail="Invite not found")
    if invite.revoked:
        logger.info(f"Invite ID {invite_id} already revoked.")
        raise HTTPException(status_code=400, detail="Invite already revoked")
    invite.revoked = True
    activity = QLActivity(
        quest_log_id=quest_log_id,
        user_id=owner.id,
        action="invite_revoked",
        details=f"Invite {invite.token} revoked by {username}"
    )
    db.add(activity)
    db.commit()
    logger.info(f"Invite {invite.token} revoked for Quest Log ID {quest_log_id} by {username}.")
    return {"message": "Invite revoked successfully"}

@router.get("/invite/details", response_model=dict)
def get_invite_details(token: str, db: Session = Depends(get_db)):
    """
    Return details for an invite link based on the token.
    This includes the quest log (board) name, owner, and other invite details.
    """
    invite = db.query(QuestLogInvite).filter(QuestLogInvite.token == token).first()
    if not invite:
        logger.error(f"Invite token {token} not found.")
        raise HTTPException(status_code=404, detail="Invite not found")
    quest_log = db.query(QuestLog).filter(QuestLog.id == invite.quest_log_id).first()
    if not quest_log:
        logger.error(f"Quest Log for invite token {token} not found.")
        raise HTTPException(status_code=404, detail="Quest Log not found")
    owner = db.query(User).filter(User.id == quest_log.owner_id).first()
    return {
        "quest_log_id": quest_log.id,
        "quest_log_name": quest_log.name,
        "owner_username": owner.username if owner else "Unknown",
        "is_permanent": invite.is_permanent,
        "expires_at": invite.expires_at,
        "revoked": invite.revoked
    }

@router.post("/{quest_log_id}/upgrade", response_model=dict)
def upgrade_membership(quest_log_id: int, username: str, db: Session = Depends(get_db)):
    """
    Upgrade a spectator membership to a member.
    Only allowed if the user is currently a spectator.
    """
    membership = db.query(QuestLogMembership).filter(
        QuestLogMembership.quest_log_id == quest_log_id,
        QuestLogMembership.user.has(username=username)
    ).first()
    if not membership:
        logger.error(f"Membership not found for user {username} in Quest Log {quest_log_id}.")
        raise HTTPException(status_code=404, detail="Membership not found")
    if membership.role == "member":
        return {"message": "User is already a member."}
    membership.role = "member"
    activity = QLActivity(
        quest_log_id=quest_log_id,
        user_id=membership.user_id,
        action="upgraded",
        details=f"User {username} upgraded from spectator to member."
    )
    db.add(activity)
    db.commit()
    logger.info(f"User {username} upgraded from spectator to member in Quest Log {quest_log_id}.")
    return {"message": "Membership upgraded to member."}
