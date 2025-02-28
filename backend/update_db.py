import sqlite3
from db import engine
from models import Base
import os

# Tables to drop (all except "users")
TABLES_TO_DROP = ["task_history", "stories", "comments", "tasks"]

def column_exists(cursor, table, column):
    cursor.execute(f"PRAGMA table_info({table})")
    columns = [row[1] for row in cursor.fetchall()]
    return column in columns

def update_users_table(db_path="./gamified_tasks.db"):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    # Ensure new columns in users exist
    for col_def in [
        ("timezone", "TEXT DEFAULT 'UTC'"),
        ("show_tooltips", "BOOLEAN DEFAULT 1"),
        ("dark_mode", "BOOLEAN DEFAULT 0"),
        ("skip_confirm_begin", "BOOLEAN DEFAULT 0"),
        ("skip_confirm_end", "BOOLEAN DEFAULT 0")
    ]:
        col, definition = col_def
        if not column_exists(cursor, "users", col):
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col} {definition}")
            print(f"Added column '{col}' to 'users' table.")
        else:
            print(f"Column '{col}' already exists in 'users' table.")
    conn.commit()
    conn.close()

def drop_non_user_tables(db_path="./gamified_tasks.db"):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = OFF;")
    for table in TABLES_TO_DROP:
        cursor.execute(f"DROP TABLE IF EXISTS {table};")
        print(f"Dropped table '{table}' if it existed.")
    conn.commit()
    conn.close()

def recreate_tables():
    Base.metadata.create_all(bind=engine)
    print("Recreated missing tables from models.")

def update_db(db_path="./gamified_tasks.db"):
    print("Updating users table...")
    update_users_table(db_path)
    print("Dropping non-user tables...")
    drop_non_user_tables(db_path)
    print("Recreating dropped tables...")
    recreate_tables()
    print("Database migration complete.")

if __name__ == "__main__":
    update_db()
