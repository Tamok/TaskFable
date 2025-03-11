"""
backend/models.py
-----------------
Data models for TaskFable.
This file defines core models (User, Task, Comment, Story, TaskHistory) and new Quest Log (QL) features.
"""

from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, Boolean, ForeignKey
from datetime import datetime
import enum
import uuid

# Use the new declarative_base API
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
    skip_confirm_begin = Column(Boolean, default=False)
    skip_confirm_end = Column(Boolean, default=False)
    tasks = relationship("Task", back_populates="owner")
    comments = relationship("Comment", back_populates="owner")
    stories = relationship("Story", back_populates="owner")

# Quest Log models
class QuestLog(Base):
    __tablename__ = "quest_logs"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    owner = relationship("User", backref="owned_quest_logs")
    tasks = relationship("Task", back_populates="quest_log", cascade="all, delete-orphan")
    memberships = relationship("QuestLogMembership", back_populates="quest_log", cascade="all, delete-orphan")
    invites = relationship("QuestLogInvite", back_populates="quest_log", cascade="all, delete-orphan")
    activities = relationship("QLActivity", back_populates="quest_log", cascade="all, delete-orphan")
    mirrors = relationship("TaskMirror", back_populates="quest_log", cascade="all, delete-orphan")

class QuestLogMembership(Base):
    __tablename__ = "quest_log_memberships"
    id = Column(Integer, primary_key=True, index=True)
    quest_log_id = Column(Integer, ForeignKey("quest_logs.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    role = Column(String, default="member")  # "member" or "spectator"
    quest_log = relationship("QuestLog", back_populates="memberships")
    user = relationship("User", backref="quest_log_memberships")

class QuestLogInvite(Base):
    __tablename__ = "quest_log_invites"
    id = Column(Integer, primary_key=True, index=True)
    quest_log_id = Column(Integer, ForeignKey("quest_logs.id"), nullable=False)
    token = Column(String, unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    used = Column(Boolean, default=False)
    revoked = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=True)
    is_permanent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    quest_log = relationship("QuestLog", back_populates="invites")

class QLActivity(Base):
    __tablename__ = "ql_activities"
    id = Column(Integer, primary_key=True, index=True)
    quest_log_id = Column(Integer, ForeignKey("quest_logs.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    quest_log = relationship("QuestLog", back_populates="activities")
    user = relationship("User", backref="ql_activities")

class TaskMirror(Base):
    __tablename__ = "task_mirrors"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    quest_log_id = Column(Integer, ForeignKey("quest_logs.id"), nullable=False)
    note = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    task = relationship("Task", backref="mirrors")
    quest_log = relationship("QuestLog", back_populates="mirrors")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String, default="blue")
    status = Column(Enum(TaskStatus), default=TaskStatus.todo)
    scheduled_time = Column(DateTime, nullable=True)
    repeat_interval = Column(Integer, nullable=True)
    is_private = Column(Boolean, default=False)
    locked = Column(Boolean, default=False)
    owner_id = Column(Integer, ForeignKey("users.id"))
    co_owner_ids = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    quest_log_id = Column(Integer, ForeignKey("quest_logs.id"), nullable=False)
    owner = relationship("User", back_populates="tasks")
    comments = relationship("Comment", back_populates="task")
    story = relationship("Story", uselist=False, back_populates="task")
    history = relationship("TaskHistory", back_populates="task")
    quest_log = relationship("QuestLog", back_populates="tasks")

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
