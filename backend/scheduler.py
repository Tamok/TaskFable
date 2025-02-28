# backend/scheduler.py
import time
from datetime import datetime
from db import SessionLocal
from models import Task, TaskStatus

def schedule_tasks():
    """
    Periodically checks for tasks with a scheduled_time in the past.
    If a task’s scheduled_time is due and it has a repeat_interval, reset its status to "To-Do".
    """
    db = SessionLocal()
    try:
        while True:
            now = datetime.utcnow()
            tasks_to_update = db.query(Task).filter(Task.scheduled_time <= now).all()
            for task in tasks_to_update:
                # If the task is not already active, reset its status
                if task.status != TaskStatus.todo:
                    task.status = TaskStatus.todo
                    db.commit()
            time.sleep(60)  # Check every minute
    finally:
        db.close()

# To run the scheduler, you might want to start it in a separate process or thread.
