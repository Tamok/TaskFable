import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Get the absolute directory of this file.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Construct the full path to the database file.
SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'gamified_tasks.db')}"  

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
