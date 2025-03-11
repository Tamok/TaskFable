"""
backend/init_db.py
------------------
This script initializes the TaskFable database for a first-time install.
It creates all tables (using SQLAlchemy's metadata) and sets the initial database version.
A version table ("db_version") is created to track the database schema version.
"""

import os
from db import engine
from models import Base
import sqlalchemy
from sqlalchemy import Table, Column, String, MetaData
import logging

logger = logging.getLogger("backend-logger")

# Define the current database version for initial install.
CURRENT_DB_VERSION = "0.3.1"

def create_db_version_table():
    metadata = MetaData()
    db_version_table = Table(
        "db_version", metadata,
        Column("version", String, primary_key=True)
    )
    metadata.create_all(engine)
    return db_version_table

def set_db_version(version):
    conn = engine.connect()
    db_version_table = create_db_version_table()
    result = conn.execute(db_version_table.select())
    row = result.first()
    if row is None:
        conn.execute(db_version_table.insert().values(version=version))
        logger.info(f"Database version set to {version}")
    else:
        logger.info(f"Database already has version {row['version']}")
    conn.close()

if __name__ == "__main__":
    db_file = "./gamified_tasks.db"
    if os.path.exists(db_file):
        os.remove(db_file)
        logger.info("Removed existing database file for fresh initialization.")
    # Create all tables.
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created.")
    # Set the database version.
    set_db_version(CURRENT_DB_VERSION)
    logger.info("Database initialization complete.")
