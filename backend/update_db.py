"""
backend/update_db.py
--------------------
This script updates the TaskFable database by preserving the "users" table and recreating
all other tables from scratch. It also updates the stored database version.
Verbose logging is enabled to indicate each major step.
"""

import sqlite3
from db import engine
from models import Base
from sqlalchemy import text, MetaData, Table, Column, String
import os
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("backend-logger")

CURRENT_DB_VERSION = "0.3.1"
DB_PATH = "./gamified_tasks.db"

def drop_non_user_tables():
    preserve_tables = {"users", "db_version"}
    metadata = Base.metadata
    all_tables = {table.name: table for table in metadata.sorted_tables}
    tables_to_drop = [table for name, table in all_tables.items() if name not in preserve_tables]
    
    with engine.begin() as connection:
        if tables_to_drop:
            logger.info(f"Dropping tables: {[t.name for t in tables_to_drop]}")
            metadata.drop_all(bind=connection, tables=tables_to_drop)
        else:
            logger.info("No tables to drop.")

def recreate_tables():
    with engine.begin() as connection:
        Base.metadata.create_all(bind=connection)
    logger.info("Recreated tables from models.")

def create_or_update_db_version():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS db_version (
            version TEXT PRIMARY KEY
        );
    """)
    conn.commit()
    cursor.execute("SELECT version FROM db_version LIMIT 1;")
    row = cursor.fetchone()
    if row is None:
        cursor.execute("INSERT INTO db_version (version) VALUES (?);", (CURRENT_DB_VERSION,))
        logger.info(f"Database version set to {CURRENT_DB_VERSION}")
    else:
        cursor.execute("UPDATE db_version SET version = ?;", (CURRENT_DB_VERSION,))
        logger.info(f"Database version updated to {CURRENT_DB_VERSION}")
    conn.commit()
    conn.close()

def run_update():
    logger.info("Starting database update process...")
    drop_non_user_tables()
    recreate_tables()
    create_or_update_db_version()
    logger.info("Database update complete.")

if __name__ == "__main__":
    run_update()
