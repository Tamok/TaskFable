from db import engine
from models import Base
import os

db_file = "./gamified_tasks.db"
if os.path.exists(db_file):
    os.remove(db_file)
    print("Removed existing database file.")

Base.metadata.create_all(bind=engine)
print("Database tables created.")
