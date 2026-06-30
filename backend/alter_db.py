import sqlite3
import os

DB_FILE = "astra_ai_local.db"

def alter_database():
    if not os.path.exists(DB_FILE):
        print(f"Database {DB_FILE} does not exist.")
        return

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    print("Creating projects table if it doesn't exist...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT NOT NULL,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )""")
    
    print("Altering chat_sessions table to add project_id...")
    try:
        cursor.execute("ALTER TABLE chat_sessions ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;")
        print("Successfully added project_id column.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("Column project_id already exists.")
        else:
            print(f"Error altering table: {e}")
            
    conn.commit()
    conn.close()
    print("Database alteration complete.")

if __name__ == "__main__":
    alter_database()
