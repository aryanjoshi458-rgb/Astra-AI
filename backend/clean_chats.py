import sqlite3

try:
    conn = sqlite3.connect("astra_ai_local.db")
    cursor = conn.cursor()
    
    # Delete sessions titled 'New Chat'
    cursor.execute("DELETE FROM chat_sessions WHERE title = 'New Chat'")
    deleted_count = cursor.rowcount
    conn.commit()
    conn.close()
    
    print(f"Successfully deleted {deleted_count} empty 'New Chat' sessions.")
except Exception as e:
    print(f"Error cleaning database: {e}")
