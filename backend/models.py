from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

Base = declarative_base()

class TaskStatus(str, enum.Enum):
    todo = "To-Do"
    doing = "Doing"
    waiting = "Waiting"
    done = "Done"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)  # Hashed password
    xp = Column(Integer, default=0)
    currency = Column(Integer, default=0)
    timezone = Column(String, default="UTC")
    show_tooltips = Column(Boolean, default=True)
    dark_mode = Column(Boolean, default=False)
    skip_confirm_begin = Column(Boolean, default=False)  # false = show confirm
    skip_confirm_end = Column(Boolean, default=False)
    tasks = relationship("Task", back_populates="owner")
    comments = relationship("Comment", back_populates="owner")
    stories = relationship("Story", back_populates="owner")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String, default="blue")
    status = Column(Enum(TaskStatus), default=TaskStatus.todo)
    scheduled_time = Column(DateTime, nullable=True)
    repeat_interval = Column(Integer, nullable=True)  # in minutes
    is_private = Column(Boolean, default=False)
    locked = Column(Boolean, default=False)  # New: locked quest
    owner_id = Column(Integer, ForeignKey("users.id"))
    co_owner_ids = Column(Text, nullable=True)  # Comma-separated user IDs
    created_at = Column(DateTime, default=datetime.utcnow)
    owner = relationship("User", back_populates="tasks")
    comments = relationship("Comment", back_populates="task")
    story = relationship("Story", uselist=False, back_populates="task")
    history = relationship("TaskHistory", back_populates="task")

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    task = relationship("Task", back_populates="comments")
    owner = relationship("User", back_populates="comments")

class Story(Base):
    __tablename__ = "stories"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    owner_id = Column(Integer, ForeignKey("users.id"))
    story_text = Column(Text)
    xp = Column(Integer)
    currency = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    task = relationship("Task", back_populates="story")
    owner = relationship("User", back_populates="stories")

class TaskHistory(Base):
    __tablename__ = "task_history"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    status = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    task = relationship("Task", back_populates="history")
