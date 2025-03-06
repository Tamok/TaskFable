from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from datetime import datetime
from models import Task, TaskStatus, User, Comment, TaskHistory
from db import SessionLocal
from llm_integration import generate_story_for_task
from routers.stories import add_story
from pydantic import BaseModel, field_validator
import logging_config
from sqlalchemy import text

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class TaskCreate(BaseModel):
    title: str
    description: str = None
    color: str = "blue"
    scheduled_time: datetime = None
    repeat_interval: int = None
    is_private: bool = False
    locked: bool = False           # <-- NEW: allow creating a locked task
    owner_username: str
    co_owners: str = ""  # Comma-separated usernames

class StatusUpdate(BaseModel):
    new_status: TaskStatus
    username: str

class CommentCreate(BaseModel):
    task_id: int
    content: str
    username: str

class TaskEdit(BaseModel):
    description: str

class CommentEdit(BaseModel):
    comment_id: int
    task_id: int
    new_content: str
    username: str

    @field_validator("comment_id", mode="before")
    def cast_comment_id(cls, v):
        try:
            return int(v)
        except Exception as e:
            raise ValueError("comment_id must be an integer") from e

    @field_validator("task_id", mode="before")
    def cast_task_id(cls, v):
        try:
            return int(v)
        except Exception as e:
            raise ValueError("task_id must be an integer") from e

@router.get("/", response_model=list)
def get_tasks(viewer_username: str = Query(...), db: Session = Depends(get_db)):
    tasks = db.query(Task).all()
    task_list = []
    for task in tasks:
        owner = db.query(User).filter(User.id == task.owner_id).first()
        co_owners = []
        if task.co_owner_ids:
            for uid in task.co_owner_ids.split(","):
                uid_str = uid.strip()
                try:
                    num = int(uid_str)
                    u = db.query(User).filter(User.id == num).first()
                    if u:
                        co_owners.append(u.username)
                except:
                    continue
        is_owner = (owner.username == viewer_username) or (viewer_username in co_owners)
        # Fetch task history records
        history_records = db.query(TaskHistory).filter(TaskHistory.task_id == task.id).order_by(TaskHistory.timestamp.asc()).all()
        history_list = [{"status": h.status, "timestamp": h.timestamp.isoformat()} for h in history_records]
        
        if task.is_private and not is_owner:
            task_dict = {
                "id": task.id,
                "title": "Solo Adventure",
                "description": "Solo Adventure",
                "color": task.color,
                "status": task.status,
                "scheduled_time": task.scheduled_time,
                "repeat_interval": task.repeat_interval,
                "is_private": task.is_private,
                "locked": task.locked,
                "owner_id": task.owner_id,
                "owner_username": owner.username,  # Always show owner
                "co_owners": [],
                "comments": [],
                "history": history_list
            }
        else:
            task_dict = {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "color": task.color,
                "status": task.status,
                "scheduled_time": task.scheduled_time,
                "repeat_interval": task.repeat_interval,
                "is_private": task.is_private,
                "locked": task.locked,
                "owner_id": task.owner_id,
                "owner_username": owner.username if owner else "Unknown",
                "co_owners": co_owners,
                "comments": [
                    {
                        "id": c.id,
                        "content": c.content,
                        "created_at": c.created_at,
                        "user_id": c.user_id,
                        "owner_username": db.query(User).filter(User.id == c.user_id).first().username 
                                          if db.query(User).filter(User.id == c.user_id).first() else "Anonymous"
                    }
                    for c in task.comments
                ],
                "history": history_list
            }
        task_list.append(task_dict)
    return task_list

@router.post("/", response_model=dict)
def create_task(task_data: TaskCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == task_data.owner_username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    co_owner_usernames = [x.strip() for x in task_data.co_owners.split(",") if x.strip()]
    co_owner_ids_list = []
    for username in co_owner_usernames:
        co_owner = db.query(User).filter(User.username == username).first()
        if not co_owner:
            raise HTTPException(status_code=400, detail=f"Co-owner '{username}' does not exist")
        co_owner_ids_list.append(str(co_owner.id))
    co_owner_ids_str = ",".join(co_owner_ids_list) if co_owner_ids_list else ""

    task = Task(
        title=task_data.title,
        description=task_data.description,
        color=task_data.color,
        scheduled_time=task_data.scheduled_time,
        repeat_interval=task_data.repeat_interval,
        is_private=task_data.is_private,
        locked=task_data.locked,       # <-- NEW: set locked value from request
        owner_id=user.id,
        status=TaskStatus.todo,
        co_owner_ids=co_owner_ids_str
    )

    db.add(task)
    db.commit()
    db.refresh(task)
    logging_config.backend_logger.info(f"Task created: {task.id} by user {user.username}")
    history_record = TaskHistory(task_id=task.id, status="Created")
    db.add(history_record)
    db.commit()
    return {"message": "Task created", "task_id": task.id}

@router.put("/{task_id}/status", response_model=dict)
def update_task_status(task_id: int, status_data: StatusUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    current_status = task.status
    new_status = status_data.new_status
    allowed_transitions = {
        TaskStatus.todo: [TaskStatus.doing],
        TaskStatus.doing: [TaskStatus.waiting, TaskStatus.done],
        TaskStatus.waiting: [TaskStatus.doing, TaskStatus.done],
        TaskStatus.done: []
    }
    if new_status not in allowed_transitions[current_status]:
        raise HTTPException(status_code=400, detail=f"Invalid transition from {current_status} to {new_status}")
    
    logging_config.backend_logger.debug(
        f"User {status_data.username} requested status change for task {task.id} from {current_status} to {new_status}"
    )
    
    task.status = new_status
    db.commit()
    db.refresh(task)
    logging_config.backend_logger.info(f"Task {task.id} status updated to {new_status} by user {status_data.username}")
    
    history_record = TaskHistory(task_id=task.id, status=new_status)
    db.add(history_record)
    db.commit()
    
    if current_status == TaskStatus.todo and new_status == TaskStatus.doing:
        story_text, xp, currency = generate_story_for_task(task, db)
        add_story(task_id, task.owner_id, story_text, xp, currency, db)
    
    if new_status == TaskStatus.done:
        # Lock the task when marked as done
        task.locked = True
        db.commit()
        logging_config.backend_logger.info(f"Task {task.id} locked as done")
        
        participants = {task.owner_id}
        for comment in task.comments:
            participants.add(comment.user_id)
        num_participants = len(participants)
        if num_participants > 0:
            xp_split = 10 // num_participants
            currency_split = 5 // num_participants
            for user_id in participants:
                u = db.query(User).filter(User.id == user_id).first()
                if u:
                    u.xp += xp_split
                    u.currency += currency_split
            db.commit()
    
    return {"message": "Task updated", "task_id": task.id}


@router.post("/comment", response_model=dict)
def add_comment(comment_data: CommentCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == comment_data.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    task = db.query(Task).filter(Task.id == comment_data.task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    comment = Comment(
        content=comment_data.content,
        task_id=task.id,
        user_id=user.id
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    logging_config.backend_logger.info(f"Comment added to task {task.id} by user {user.username}")
    return {"message": "Comment added", "comment_id": comment.id}

@router.put("/comment/edit", response_model=dict)
def edit_comment(comment_data: CommentEdit = Body(...), db: Session = Depends(get_db)):
    # Look up the comment using both comment_id and task_id for extra validation.
    comment = db.query(Comment).filter(
        Comment.id == comment_data.comment_id,
        Comment.task_id == comment_data.task_id
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found for given task")
    
    user = db.query(User).filter(User.username == comment_data.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if comment.user_id != user.id:
        raise HTTPException(status_code=403, detail="Cannot edit another user's comment")
    
    comment.content = comment_data.new_content
    db.commit()
    db.refresh(comment)
    logging_config.backend_logger.info(f"Comment {comment.id} edited by user {user.username}")
    return {"message": "Comment updated", "comment_id": comment.id}

@router.put("/{task_id}/edit", response_model=dict)
def edit_task_description(task_id: int, edit_data: TaskEdit, username: str, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    owner = db.query(User).filter(User.id == task.owner_id).first()
    co_owner_ids = []
    if task.co_owner_ids:
        co_owner_ids = [int(x.strip()) for x in task.co_owner_ids.split(",") if x.strip().isdigit()]
    if owner.username != username and username not in [db.query(User).filter(User.id==uid).first().username for uid in co_owner_ids]:
        raise HTTPException(status_code=403, detail="Only the owner or co-owners can edit the task")
    if task.status == TaskStatus.done:
        raise HTTPException(status_code=400, detail="Cannot edit description on Done tasks")
    task.description = edit_data.description
    db.commit()
    db.refresh(task)
    logging_config.backend_logger.info(f"Task {task.id} description edited by user {username}")
    return {"message": "Task description updated", "task_id": task.id}

@router.post("/dev/purge", response_model=dict)
def purge_tasks(db: Session = Depends(get_db)):
    db.execute(text("DELETE FROM task_history;"))
    db.execute(text("DELETE FROM stories;"))
    db.execute(text("DELETE FROM comments;"))
    db.execute(text("DELETE FROM tasks;"))
    db.commit()
    logging_config.backend_logger.info("All tasks purged by dev command.")
    return {"message": "All tasks purged."}

@router.post("/dev/delete_todo", response_model=dict)
def delete_todo_tasks(db: Session = Depends(get_db)):
    deleted = db.query(Task).filter(Task.status == TaskStatus.todo).delete()
    db.commit()
    logging_config.backend_logger.info(f"{deleted} To-Do tasks deleted by dev command.")
    return {"message": f"{deleted} To-Do tasks deleted."}
