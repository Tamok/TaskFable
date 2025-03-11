from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..db import SessionLocal
from ..models import Story, Task, User
from datetime import datetime
from .. import logging_config


router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def add_story(task_id: int, owner_id: int, story: str, xp: int, currency: int, db: Session):
    new_story = Story(
        task_id=task_id,
        owner_id=owner_id,
        story_text=story,
        xp=xp,
        currency=currency,
        created_at=datetime.utcnow()
    )
    db.add(new_story)
    db.commit()
    db.refresh(new_story)
    logging_config.backend_logger.info(f"Story created for task {task_id}")
    return new_story

@router.get("/", response_model=list)
def get_stories(viewer_username: str, db: Session = Depends(get_db)):
    """
    Retrieve all stories. For private tasks, if the viewer is not the owner, obfuscate the story text.
    """
    viewer = db.query(User).filter(User.username == viewer_username).first()
    if not viewer:
        raise HTTPException(status_code=404, detail="Viewer user not found")
    stories = db.query(Story).order_by(Story.created_at.desc()).all()
    result = []
    for story in stories:
        task = db.query(Task).filter(Task.id == story.task_id).first()
        if task.is_private and task.owner_id != viewer.id:
            display_story = "Solo Adventure"
        else:
            display_story = story.story_text
        result.append({
            "id": story.id,
            "task_id": story.task_id,
            "owner_id": story.owner_id,
            "story_text": display_story,
            "xp": story.xp,
            "currency": story.currency,
            "created_at": story.created_at
        })
    return result
