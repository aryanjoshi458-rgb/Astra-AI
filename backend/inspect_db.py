import sqlite3

try:
    conn = sqlite3.connect("astra_ai_local.db")
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    print("--- CHAT SESSIONS ---")
    cursor.execute("SELECT * FROM chat_sessions")
    sessions = cursor.fetchall()
    for s in sessions:
        print(f"ID: {s['id']}, Title: {s['title']}, Pinned: {s['is_pinned']}, Updated: {s['updated_at']}")
        
    print("\n--- MESSAGES ---")
    cursor.execute("SELECT * FROM messages")
    messages = cursor.fetchall()
    for m in messages:
        print(f"ID: {m['id']}, Session ID: {m['session_id']}, Sender: {m['sender']}, Content preview: {m['content'][:30]}")
        
    conn.close()
except Exception as e:
    print(f"Error inspecting DB: {e}")
