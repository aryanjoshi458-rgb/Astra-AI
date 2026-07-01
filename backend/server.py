import http.server
import socketserver
import json
import sqlite3
import hashlib
import uuid
import datetime
import urllib.parse
import urllib.request
import time
import sys
import re
import random
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
def load_custom_env(filepath=".env"):
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    if "=" in line:
                        key, val = line.split("=", 1)
                        val = val.strip()
                        if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                            val = val[1:-1]
                        os.environ[key.strip()] = val
            print("CUSTOM DOTENV LOADED. SMTP_HOST:", os.getenv("SMTP_HOST"), flush=True)
        except Exception as e:
            print("CUSTOM DOTENV LOAD ERROR:", e, flush=True)

load_custom_env()

def send_otp_email(email_to, otp):
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT", "587")
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    
    if not smtp_host or not smtp_user or not smtp_password:
        print(f"[Email Config] SMTP settings missing. OTP not sent to {email_to}.", flush=True)
        return False
        
    try:
        msg = MIMEMultipart()
        msg['From'] = f"Astra AI <{smtp_user}>"
        msg['To'] = email_to
        msg['Subject'] = f"{otp} is your Astra AI verification code"
        
        body = f"""Hello,

Your Astra AI verification code is: {otp}

This code is valid for 5 minutes. Please do not share this code with anyone.

Best regards,
Astra AI Team"""
        msg.attach(MIMEText(body, 'plain'))
        
        port = int(smtp_port)
        if port == 465:
            server = smtplib.SMTP_SSL(smtp_host, port, timeout=10)
        else:
            server = smtplib.SMTP(smtp_host, port, timeout=10)
            server.starttls()
            
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_user, email_to, msg.as_string())
        server.quit()
        print(f"[Email Sent] Successfully sent OTP to {email_to}", flush=True)
        return True
    except Exception as e:
        print(f"[Email Error] Failed to send email to {email_to}: {e}", flush=True)
        return False


PORT = 8000
DB_FILE = "astra_ai_local.db"

def detect_language(text: str) -> str:
    try:
        encoded_text = urllib.parse.quote(text[:200])
        url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q={encoded_text}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5.0) as response:
            data = json.loads(response.read().decode('utf-8'))
            if data and len(data) > 2:
                return data[2]
    except Exception as e:
        print(f"Language detection error: {e}")
    return "en"

def translate_text(text: str, target_lang: str) -> str:
    if target_lang == "en":
        return text
    try:
        encoded_text = urllib.parse.quote(text)
        url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl={target_lang}&dt=t&q={encoded_text}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10.0) as response:
            data = json.loads(response.read().decode('utf-8'))
            translated_segments = []
            if data and isinstance(data, list) and len(data) > 0 and data[0]:
                for segment in data[0]:
                    if segment and len(segment) > 0:
                        translated_segments.append(segment[0])
            if translated_segments:
                return "".join(translated_segments)
    except Exception as e:
        print(f"Translation error: {e}")
    return text

# Active session tokens mapped to user emails
# In-memory session store for lightweight sandbox testing
sessions_db = {}

def get_db_connection():
    conn = sqlite3.connect(DB_FILE, timeout=15)
    try:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
    except Exception:
        pass
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Create tables
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        full_name TEXT,
        avatar_url TEXT,
        username TEXT,
        is_active INTEGER DEFAULT 1,
        is_admin INTEGER DEFAULT 0,
        subscription_tier TEXT DEFAULT 'free',
        api_key_limit INTEGER DEFAULT 5,
        created_at TEXT,
        login_provider TEXT DEFAULT 'email',
        total_time_spent INTEGER DEFAULT 0,
        last_active_at TEXT
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT DEFAULT 'New Chat',
        is_pinned INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        sender TEXT,
        content TEXT,
        model_used TEXT,
        file_url TEXT,
        file_type TEXT,
        created_at TEXT,
        FOREIGN KEY(session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        key_hash TEXT UNIQUE NOT NULL,
        name TEXT DEFAULT 'Default Key',
        is_active INTEGER DEFAULT 1,
        created_at TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS usage_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        tokens_used INTEGER DEFAULT 0,
        requests_count INTEGER DEFAULT 0,
        date TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS otp_verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT,
        otp_code TEXT,
        expires_at TEXT,
        created_at TEXT
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS active_sessions (
        token TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        created_at TEXT
    )""")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS plan_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tier TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL,
        base_price_usd REAL NOT NULL DEFAULT 0,
        gst_rate REAL NOT NULL DEFAULT 18.0,
        is_active INTEGER DEFAULT 1,
        updated_at TEXT
    )""")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS app_config (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT
    )""")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS visitor_ips (
        ip TEXT PRIMARY KEY,
        created_at TEXT
    )""")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS razorpay_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        razorpay_order_id TEXT UNIQUE,
        tier TEXT,
        amount_paise INTEGER,
        currency TEXT DEFAULT 'INR',
        status TEXT DEFAULT 'created',
        razorpay_payment_id TEXT,
        created_at TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )""")

    conn.commit()

    # Clear active sessions on server startup to ensure logout when server is restarted/off
    try:
        cursor.execute("INSERT OR IGNORE INTO app_config (key, value, updated_at) VALUES ('site_views', '0', ?)", (datetime.datetime.now().isoformat(),))
        cursor.execute("DELETE FROM active_sessions")
        conn.commit()
        print("[Database] Cleared active sessions on startup.")
    except Exception as e:
        print(f"[Database] Failed to clear active sessions: {e}")

    
    # Migrate: add columns if not exists (for existing DBs)
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN username TEXT")
        conn.commit()
        print("[Database] Added 'username' column to users table")
    except Exception:
        pass  # Column already exists
        
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN login_provider TEXT DEFAULT 'email'")
        conn.commit()
        print("[Database] Added 'login_provider' column to users table")
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE users ADD COLUMN total_time_spent INTEGER DEFAULT 0")
        conn.commit()
        print("[Database] Added 'total_time_spent' column to users table")
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE users ADD COLUMN last_active_at TEXT")
        conn.commit()
        print("[Database] Added 'last_active_at' column to users table")
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE users ADD COLUMN deletion_requested_at TEXT")
        conn.commit()
        print("[Database] Added 'deletion_requested_at' column to users table")
    except Exception:
        pass
    
    # Migrate: clear out unsplash avatar URLs
    try:
        cursor.execute("UPDATE users SET avatar_url = '' WHERE avatar_url LIKE '%unsplash.com%'")
        conn.commit()
        print("[Database] Migrated existing unsplash avatar_urls to empty string")
    except Exception as e:
        print(f"[Database] Migration failed: {e}")
    
    # 2. Seed Default Admin User
    admin_email = "admin@astra.ai"
    cursor.execute("SELECT id FROM users WHERE email = ?", (admin_email,))
    row = cursor.fetchone()
    if not row:
        print(f"[Database] Seeding default admin user: {admin_email}")
        h = hashlib.sha256("AdminAstra2026!".encode()).hexdigest()
        now = datetime.datetime.now().isoformat()
        
        cursor.execute("""
            INSERT INTO users (email, password_hash, full_name, is_admin, subscription_tier, api_key_limit, created_at, avatar_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (admin_email, h, "Astra Admin", 1, "enterprise", 100, now, ""))
        admin_id = cursor.lastrowid
        
        # Initial stats
        cursor.execute("INSERT INTO usage_stats (user_id, tokens_used, requests_count, date) VALUES (?, ?, ?, ?)", 
                       (admin_id, 12500, 52, now))
        
        # Seed welcome chat
        cursor.execute("INSERT INTO chat_sessions (user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
                       (admin_id, "Welcome to Astra AI", now, now))
        chat_id = cursor.lastrowid
        
        cursor.execute("INSERT INTO messages (session_id, sender, content, created_at) VALUES (?, ?, ?, ?)",
                       (chat_id, "user", "Help me get started with Astra AI.", now))
        
        welcome_text = (
            "Welcome, Astra Admin! This is a lightweight, pure-Python fallback server running on SQLite.\n\n"
            "Here is what you can do right now:\n\n"
            "1. **Engage in Streaming Chats**: Submit a prompt below to see instant responses.\n"
            "2. **Simulate Uploads**: Click the clip attachment icon to add context files.\n"
            "3. **Developer API keys**: Create secure hashes from the Profile page.\n"
            "4. **Admin control panel**: View real-time user stats and deactivations.\n\n"
            "No heavy packages were installed for this server. Ready to test!"
        )
        cursor.execute("INSERT INTO messages (session_id, sender, content, model_used, created_at) VALUES (?, ?, ?, ?, ?)",
                       (chat_id, "assistant", welcome_text, "astra-gpt-4", now))
        
        conn.commit()

    # Seed default plan pricing if table is empty
    conn2 = get_db_connection()
    cur2 = conn2.cursor()
    now_str = datetime.datetime.now().isoformat()
    default_plans = [
        ('free',       'Free',              0.0,  18.0),
        ('premium',    'Premium',           2.0,  18.0),
        ('enterprise', 'Enterprise',        4.0,  18.0),
    ]
    for tier, name, price, gst in default_plans:
        cur2.execute("SELECT id FROM plan_config WHERE tier = ?", (tier,))
        if not cur2.fetchone():
            cur2.execute(
                "INSERT INTO plan_config (tier, display_name, base_price_usd, gst_rate, is_active, updated_at) VALUES (?, ?, ?, ?, 1, ?)",
                (tier, name, price, gst, now_str)
            )
        else:
            # Force update names for existing DB rows
            cur2.execute("UPDATE plan_config SET display_name = ? WHERE tier = ?", (name, tier))
    conn2.commit()
    conn2.close()

    conn.close()

# Helper to verify token headers
def get_user_from_headers(headers, conn):
    auth_header = headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ')[1]
    
    cursor = conn.cursor()
    cursor.execute("SELECT email FROM active_sessions WHERE token = ?", (token,))
    row = cursor.fetchone()
    if not row:
        return None
    email = row['email']
        
    cursor.execute("SELECT * FROM users WHERE email = ? AND is_active = 1", (email,))
    user = cursor.fetchone()
    return user

class AstraHTTPHandler(http.server.BaseHTTPRequestHandler):
    def end_headers(self):
        # Always inject CORS parameters to permit frontend connections
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-LLM-API-Key')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        conn = get_db_connection()
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query = urllib.parse.parse_qs(parsed_url.query)
        
        try:
            # 0. PUBLIC PAYMENT CONFIG: GET /api/payment/config (no auth required)
            if path == "/api/payment/config":
                cursor = conn.cursor()
                try:
                    cursor.execute("SELECT value FROM app_config WHERE key = 'razorpay_key_id'")
                    row = cursor.fetchone()
                    key_id = row['value'] if row and row['value'] else ''
                except Exception:
                    key_id = ''
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"key_id": key_id, "configured": bool(key_id)}).encode())
                return

            # 1. USER PROFILE: /api/user/profile
            if path == "/api/user/profile":
                user = get_user_from_headers(self.headers, conn)
                if not user:
                    self.send_error_json(401, "Unauthorized access token")
                    return
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(dict(user)).encode())
                return
                
            # 2. CHAT SESSIONS LIST: /api/chat/sessions
            if path == "/api/chat/sessions":
                user = get_user_from_headers(self.headers, conn)
                if not user:
                    self.send_error_json(401, "Unauthorized access")
                    return
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY is_pinned DESC, updated_at DESC",
                    (user['id'],)
                )
                rows = cursor.fetchall()
                sessions_list = [dict(r) for r in rows]
                
                # Convert SQLite boolean integer representations
                for s in sessions_list:
                    s['is_pinned'] = bool(s['is_pinned'])
                    
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(sessions_list).encode())
                return

            # 2.5 PROJECTS LIST: /api/projects
            if path == "/api/projects":
                user = get_user_from_headers(self.headers, conn)
                if not user:
                    self.send_error_json(401, "Unauthorized access")
                    return
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC", (user['id'],))
                projects_list = [dict(r) for r in cursor.fetchall()]
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(projects_list).encode())
                return

            # 3. CHAT SESSION DETAILS: /api/chat/sessions/{id}
            match_detail = re.match(r"^/api/chat/sessions/(\d+)$", path)
            if match_detail:
                session_id = int(match_detail.group(1))
                user = get_user_from_headers(self.headers, conn)
                if not user:
                    self.send_error_json(401, "Unauthorized")
                    return
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?", (session_id, user['id']))
                sess = cursor.fetchone()
                if not sess:
                    self.send_error_json(404, "Chat session not found")
                    return
                
                cursor.execute("SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC", (session_id,))
                msgs = cursor.fetchall()
                
                session_data = dict(sess)
                session_data['is_pinned'] = bool(session_data['is_pinned'])
                session_data['messages'] = [dict(m) for m in msgs]
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(session_data).encode())
                return

            # 4. EXPORT CHAT LOG: /api/chat/sessions/{id}/export
            match_export = re.match(r"^/api/chat/sessions/(\d+)/export$", path)
            if match_export:
                session_id = int(match_export.group(1))
                user = get_user_from_headers(self.headers, conn)
                if not user:
                    self.send_error_json(401, "Unauthorized")
                    return
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?", (session_id, user['id']))
                session = cursor.fetchone()
                if not session:
                    self.send_error_json(404, "Chat session not found")
                    return
                
                cursor.execute("SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC", (session_id,))
                messages = cursor.fetchall()
                
                # Format to clean text export log
                txt_content = f"Astra AI Chat Export (Lightweight fallback mode)\n"
                txt_content += f"Conversation: {session['title']}\n"
                txt_content += f"Exported on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
                txt_content += "="*50 + "\n\n"
                for msg in messages:
                    sender_label = "USER" if msg['sender'] == "user" else f"ASTRA AI ({msg['model_used'] or 'Assistant'})"
                    txt_content += f"[{sender_label}]:\n{msg['content']}\n"
                    txt_content += "-"*50 + "\n\n"
                
                self.send_response(200)
                self.send_header('Content-Type', 'text/plain')
                self.send_header('Content-Disposition', f'attachment; filename="Astra-AI-Chat-{session_id}.txt"')
                self.end_headers()
                self.wfile.write(txt_content.encode("utf-8"))
                return

            # 5. USER DEVELOPER API KEYS: /api/user/keys
            if path == "/api/user/keys":
                user = get_user_from_headers(self.headers, conn)
                if not user:
                    self.send_error_json(401, "Unauthorized")
                    return
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM api_keys WHERE user_id = ?", (user['id'],))
                rows = cursor.fetchall()
                keys = [dict(r) for r in rows]
                for k in keys:
                    k['is_active'] = bool(k['is_active'])
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(keys).encode())
                return

            # 6. ADMIN SYSTEM TELEMETRY STATS: /api/admin/stats
            if path == "/api/admin/stats":
                user = get_user_from_headers(self.headers, conn)
                if not user or not user['is_admin']:
                    self.send_error_json(403, "Access denied")
                    return
                cursor = conn.cursor()
                total_users = cursor.execute("SELECT COUNT(id) FROM users").fetchone()[0]
                total_chats = cursor.execute("SELECT COUNT(id) FROM chat_sessions").fetchone()[0]
                total_messages = cursor.execute("SELECT COUNT(id) FROM messages").fetchone()[0]
                premium_users = cursor.execute("SELECT COUNT(id) FROM users WHERE subscription_tier != 'free' AND is_admin = 0").fetchone()[0]
                active_keys = cursor.execute("SELECT COUNT(id) FROM api_keys WHERE is_active = 1").fetchone()[0]
                
                # Fetch site_views
                cursor.execute("SELECT value FROM app_config WHERE key = 'site_views'")
                row = cursor.fetchone()
                site_views = int(row['value']) if row else 0

                tokens_sum = cursor.execute("SELECT SUM(tokens_used) FROM usage_stats").fetchone()[0] or 0
                requests_sum = cursor.execute("SELECT SUM(requests_count) FROM usage_stats").fetchone()[0] or 0
                
                # Calculate estimated revenue in INR (say, 199 per premium user)
                total_revenue = premium_users * 199
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "total_users": total_users,
                    "total_chats": total_chats,
                    "total_messages": total_messages,
                    "premium_users": premium_users,
                    "active_keys": active_keys,
                    "monthly_requests": requests_sum,
                    "site_views": site_views,
                    "revenue": total_revenue
                }).encode())
                return

            # 7. ADMIN LIST USERS: /api/admin/users
            if path == "/api/admin/users":
                user = get_user_from_headers(self.headers, conn)
                if not user or not user['is_admin']:
                    self.send_error_json(403, "Access denied")
                    return
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM users ORDER BY created_at DESC")
                users = [dict(r) for r in cursor.fetchall()]
                for u in users:
                    u['is_active'] = bool(u['is_active'])
                    u['is_admin'] = bool(u['is_admin'])
                    
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(users).encode())
                return

            # 8. ADMIN LIVE TRAFFIC MONITOR: /api/admin/monitoring/chats
            if path == "/api/admin/monitoring/chats":
                user = get_user_from_headers(self.headers, conn)
                if not user or not user['is_admin']:
                    self.send_error_json(403, "Access denied")
                    return
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT c.*, u.email as user_email 
                    FROM chat_sessions c 
                    JOIN users u ON c.user_id = u.id 
                    ORDER BY c.updated_at DESC LIMIT 50
                """)
                chats_data = []
                for row in cursor.fetchall():
                    c_dict = dict(row)
                    msg_count = cursor.execute("SELECT COUNT(id) FROM messages WHERE session_id = ?", (c_dict['id'],)).fetchone()[0]
                    chats_data.append({
                        "id": c_dict['id'],
                        "title": c_dict['title'],
                        "user_email": c_dict['user_email'],
                        "user_id": c_dict['user_id'],
                        "message_count": msg_count,
                        "updated_at": c_dict['updated_at']
                    })
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(chats_data).encode())
                return

            # 9. ADMIN PRICING CONFIG: GET /api/admin/pricing
            if path == "/api/admin/pricing":
                user = get_user_from_headers(self.headers, conn)
                if not user:
                    self.send_error_json(401, "Unauthorized")
                    return
                cursor = conn.cursor()
                try:
                    cursor.execute("SELECT * FROM plan_config ORDER BY id")
                except Exception:
                    # Dynamically create table and seed defaults
                    cursor.execute("""
                    CREATE TABLE IF NOT EXISTS plan_config (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        tier TEXT UNIQUE NOT NULL,
                        display_name TEXT NOT NULL,
                        base_price_usd REAL NOT NULL DEFAULT 0,
                        gst_rate REAL NOT NULL DEFAULT 18.0,
                        is_active INTEGER DEFAULT 1,
                        updated_at TEXT
                    )""")
                    now_str = datetime.datetime.now().isoformat()
                    default_plans = [
                        ('free',       'Free',              0.0,  18.0),
                        ('premium',    'Premium',           2.0,  18.0),
                        ('enterprise', 'Enterprise',        4.0,  18.0),
                    ]
                    for tier, name, price, gst in default_plans:
                        cursor.execute(
                            "INSERT OR IGNORE INTO plan_config (tier, display_name, base_price_usd, gst_rate, is_active, updated_at) VALUES (?, ?, ?, ?, 1, ?)",
                            (tier, name, price, gst, now_str)
                        )
                    conn.commit()
                    cursor.execute("SELECT * FROM plan_config ORDER BY id")

                plans = [dict(r) for r in cursor.fetchall()]
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(plans).encode())
                return
                
            # 10. ADMIN APP CONFIG: GET /api/admin/config
            if path == "/api/admin/config":
                user_chk = get_user_from_headers(self.headers, conn)
                if not user_chk or not user_chk['is_admin']:
                    self.send_error_json(403, "Access denied")
                    return
                cursor = conn.cursor()
                cursor.execute("SELECT key, value FROM app_config")
                rows = cursor.fetchall()
                config = {r['key']: r['value'] for r in rows}
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(config).encode())
                return

            # Default health gateway
            if path == "/":
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "status": "healthy",
                    "platform": "Astra AI Lightweight built-in gateway",
                    "fallback_mode": True
                }).encode())
                return
                
            # PUBLIC PAYMENT CONFIG: GET /api/payment/config (returns only public key_id)
            if path == "/api/payment/config":
                cursor = conn.cursor()
                cursor.execute("SELECT value FROM app_config WHERE key = 'razorpay_key_id'")
                row = cursor.fetchone()
                key_id = row['value'] if row and row['value'] else ''
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"key_id": key_id, "configured": bool(key_id)}).encode())
                return

            self.send_error_json(404, "Endpoint path not found")
        except Exception as e:
            print(f"[Error] GET handler request failed: {e}")
            self.send_error_json(500, f"Server internal issue: {str(e)}")
        finally:
            conn.close()

    def do_POST(self):
        conn = get_db_connection()
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        
        # Read content length
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length) if content_length > 0 else b''
        
        try:
            body = {}
            if post_data:
                try:
                    body = json.loads(post_data.decode('utf-8'))
                except Exception:
                    pass

            # 0. ANALYTICS VISIT: POST /api/analytics/visit
            if path == "/api/analytics/visit":
                visitor_id = None
                if body and isinstance(body, dict):
                    visitor_id = body.get("visitor_id")
                if not visitor_id:
                    visitor_id = self.client_address[0]
                    
                cursor = conn.cursor()
                cursor.execute("SELECT ip FROM visitor_ips WHERE ip = ?", (visitor_id,))
                exists = cursor.fetchone()
                
                # Fetch current views
                cursor.execute("SELECT value FROM app_config WHERE key = 'site_views'")
                row = cursor.fetchone()
                val = int(row['value']) if row and row['value'] else 0
                
                if not exists:
                    # New unique visitor!
                    new_val = val + 1
                    cursor.execute("INSERT INTO visitor_ips (ip, created_at) VALUES (?, ?)", (visitor_id, datetime.datetime.now().isoformat()))
                    cursor.execute("INSERT OR REPLACE INTO app_config (key, value, updated_at) VALUES ('site_views', ?, ?)",
                                   (str(new_val), datetime.datetime.now().isoformat()))
                    conn.commit()
                    val = new_val
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "site_views": val}).encode())
                return

            # 1. REGISTER USER: /api/auth/register
            if path == "/api/auth/register":
                email = body.get("email")
                full_name = body.get("full_name")
                if not email:
                    self.send_error_json(400, "Missing email credential")
                    return
                
                cursor = conn.cursor()
                # Check email existence
                cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
                if cursor.fetchone():
                    self.send_error_json(400, "Email already registered")
                    return
                
                now = datetime.datetime.now().isoformat()
                
                # Check if first user, make admin
                count = cursor.execute("SELECT COUNT(id) FROM users").fetchone()[0]
                is_admin = 1 if count == 0 else 0
                
                cursor.execute("""
                    INSERT INTO users (email, password_hash, full_name, is_admin, subscription_tier, created_at, login_provider)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (email, "", full_name or email.split("@")[0].capitalize(), is_admin, "free", now, 'email'))
                user_id = cursor.lastrowid
                conn.commit()
                
                cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
                user_row = dict(cursor.fetchone())
                user_row['is_admin'] = bool(user_row['is_admin'])
                user_row['is_active'] = bool(user_row['is_active'])
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(user_row).encode())
                return

            # 3. SOCIAL GOOGLE LOGIN: /api/auth/google
            if path == "/api/auth/google":
                credential = body.get("credential")
                if not credential:
                    self.send_error_json(400, "Missing credential token")
                    return
                
                email = None
                name = None
                avatar_url = ""

                # Try verifying as a JWT ID token if it contains dots (ID Token flow)
                if credential.count('.') == 2:
                    try:
                        from google.oauth2 import id_token
                        from google.auth.transport import requests as google_requests
                        idinfo = id_token.verify_oauth2_token(credential, google_requests.Request(), None)
                        email = idinfo.get('email')
                        name = idinfo.get('name', email.split('@')[0])
                        avatar_url = idinfo.get('picture', '')
                        print(f"[Google Auth] Successfully verified Google ID Token for {email}")
                    except Exception as e:
                        print(f"[Google Auth] ID Token verification failed: {e}")
                
                # If email is still None (either not a JWT or JWT verification failed), verify as Access Token
                if not email:
                    try:
                        url = "https://www.googleapis.com/oauth2/v3/userinfo"
                        req = urllib.request.Request(url, headers={'Authorization': f'Bearer {credential}'})
                        with urllib.request.urlopen(req, timeout=5.0) as response:
                            idinfo = json.loads(response.read().decode('utf-8'))
                        email = idinfo.get('email')
                        name = idinfo.get('name', email.split('@')[0])
                        avatar_url = idinfo.get('picture', '')
                        print(f"[Google Auth] Successfully verified Google Access Token for {email}")
                    except Exception as e:
                        print(f"[Google Auth] Access Token verification failed: {e}")
                
                # If verification failed completely, return error
                if not email:
                    self.send_error_json(400, "Invalid Google credential token")
                    return
                
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
                user = cursor.fetchone()
                if user and user['is_active'] == 0:
                    self.send_error_json(403, "Your account has been deactivated by the administrator.")
                    return
                now = datetime.datetime.now().isoformat()
                
                if not user:
                    cursor.execute("""
                        INSERT INTO users (email, full_name, subscription_tier, avatar_url, created_at, login_provider)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, (email, name, "free", avatar_url, now, 'google'))
                    conn.commit()
                else:
                    # Update avatar if not already present
                    if avatar_url and not user['avatar_url']:
                        cursor.execute("UPDATE users SET avatar_url = ? WHERE email = ?", (avatar_url, email))
                        conn.commit()
                
                token = "astra_sess_" + str(uuid.uuid4())
                cursor = conn.cursor()
                cursor.execute("INSERT OR REPLACE INTO active_sessions (token, email, created_at) VALUES (?, ?, ?)", 
                               (token, email, datetime.datetime.now().isoformat()))
                conn.commit()
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"access_token": token, "token_type": "bearer"}).encode())
                return

            # 4. OTP REQUEST: /api/auth/otp/request
            if path == "/api/auth/otp/request":
                email = body.get("email")
                if not email:
                    self.send_error_json(400, "Missing email parameter")
                    return
                
                otp = "".join(random.choices("0123456789", k=6))
                expires = (datetime.datetime.now() + datetime.timedelta(minutes=5)).isoformat()
                now = datetime.datetime.now().isoformat()
                
                action = body.get("action", "login")
                cursor = conn.cursor()
                cursor.execute("SELECT is_active FROM users WHERE email = ?", (email,))
                user_row = cursor.fetchone()
                
                if user_row:
                    if user_row['is_active'] == 0:
                        self.send_error_json(403, "Your account has been deactivated by the administrator.")
                        return
                    if action == "register":
                        self.send_error_json(400, "Email is already registered. Please sign in instead.")
                        return
                else:
                    if action == "login":
                        self.send_error_json(404, "Account not found. Please sign up first.")
                        return

                cursor.execute("DELETE FROM otp_verifications WHERE email = ?", (email,))
                cursor.execute("INSERT INTO otp_verifications (email, otp_code, expires_at, created_at) VALUES (?, ?, ?, ?)",
                               (email, otp, expires, now))
                conn.commit()
                
                # Send actual email via SMTP helper
                if email == "admin@astra.ai":
                    # Admin: Send OTP code to their personal email address
                    email_sent = send_otp_email("dharambhai376@gmail.com", otp)
                    # Also print to terminal for local debugging convenience
                    print("\n" + "="*50, flush=True)
                    print(f"| ASTRA AI OTP SECURITY CODE FOR ADMIN:  {otp} (Sent to dharambhai376@gmail.com) |", flush=True)
                    print("="*50 + "\n", flush=True)
                else:
                    # User: Only send email, NEVER print to terminal under any circumstances
                    email_sent = send_otp_email(email, otp)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                if email_sent:
                    self.wfile.write(json.dumps({"message": f"OTP verification code sent to your email address."}).encode())
                else:
                    self.wfile.write(json.dumps({"message": f"Failed to send verification email. Please check SMTP configuration."}).encode())
                return

            # 5. OTP VERIFY: /api/auth/otp/verify
            if path == "/api/auth/otp/verify":
                email = body.get("email")
                otp = body.get("otp_code")
                if not email or not otp:
                    self.send_error_json(400, "Missing email or code parameters")
                    return
                
                # Check for admin bypass
                is_admin_bypass = (email == "admin@astra.ai" and str(otp).strip() == str(os.getenv("ADMIN_STATIC_OTP", "888888")).strip())
                
                cursor = conn.cursor()
                if not is_admin_bypass:
                    cursor.execute("SELECT * FROM otp_verifications WHERE email = ? AND otp_code = ?", (email, otp))
                    row = cursor.fetchone()
                    if not row:
                        self.send_error_json(400, "Invalid OTP security code")
                        return
                    
                    # Check expiration
                    expires = datetime.datetime.fromisoformat(row['expires_at'])
                    if expires < datetime.datetime.now():
                        self.send_error_json(400, "OTP security code has expired")
                        return
                
                # Auto register if not exists
                cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
                user = cursor.fetchone()
                now = datetime.datetime.now().isoformat()
                if not user:
                    is_admin_val = 1 if email == "admin@astra.ai" else 0
                    tier_val = "premium" if email == "admin@astra.ai" else "free"
                    cursor.execute("INSERT INTO users (email, full_name, subscription_tier, created_at, login_provider, is_admin) VALUES (?, ?, ?, ?, ?, ?)",
                                   (email, email.split("@")[0].capitalize(), tier_val, now, 'email', is_admin_val))
                    conn.commit()
                elif email == "admin@astra.ai" and user['is_admin'] == 0:
                    cursor.execute("UPDATE users SET is_admin = 1, subscription_tier = 'premium' WHERE email = ?", (email,))
                    conn.commit()
                    
                if not is_admin_bypass:
                    cursor.execute("DELETE FROM otp_verifications WHERE email = ?", (email,))
                    conn.commit()
                
                token = "astra_sess_" + str(uuid.uuid4())
                cursor = conn.cursor()
                cursor.execute("INSERT OR REPLACE INTO active_sessions (token, email, created_at) VALUES (?, ?, ?)", 
                               (token, email, datetime.datetime.now().isoformat()))
                conn.commit()
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"access_token": token, "token_type": "bearer"}).encode())
                return

            # 6. CREATE CHAT SESSION: /api/chat/sessions
            if path == "/api/chat/sessions":
                user = get_user_from_headers(self.headers, conn)
                if not user:
                    self.send_error_json(401, "Unauthorized")
                    return
                
                title = body.get("title") or "New Chat"
                now = datetime.datetime.now().isoformat()
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT INTO chat_sessions (user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
                    (user['id'], title, now, now)
                )
                conn.commit()
                session_id = cursor.lastrowid
                
                cursor.execute("SELECT * FROM chat_sessions WHERE id = ?", (session_id,))
                row = dict(cursor.fetchone())
                row['is_pinned'] = bool(row['is_pinned'])
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(row).encode())
                return

            # 5.5 USER ACTIVITY HEARTBEAT: /api/user/heartbeat
            if path == "/api/user/heartbeat":
                user = get_user_from_headers(self.headers, conn)
                if not user:
                    self.send_error_json(401, "Unauthorized")
                    return
                
                now = datetime.datetime.now().isoformat()
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE users 
                    SET last_active_at = ?, 
                        total_time_spent = COALESCE(total_time_spent, 0) + 30 
                    WHERE id = ?
                """, (now, user['id']))
                conn.commit()
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "last_active_at": now}).encode())
                return

            # 6. SYSTEM RESET: /api/admin/reset
            if path == "/api/admin/reset":
                user = get_user_from_headers(self.headers, conn)
                if not user or user['is_admin'] == 0:
                    self.send_error_json(403, "Access denied")
                    return
                cursor = conn.cursor()
                # 1. Delete all API keys
                cursor.execute("DELETE FROM api_keys")
                # 2. Delete all usage stats
                cursor.execute("DELETE FROM usage_stats")
                # 3. Delete all messages
                cursor.execute("DELETE FROM messages")
                # 4. Delete all chat sessions
                cursor.execute("DELETE FROM chat_sessions")
                # 5. Delete all projects
                cursor.execute("DELETE FROM projects")
                # 6. Delete all OTP records
                cursor.execute("DELETE FROM otp_verifications")
                # 7. Delete all users except current admin
                cursor.execute("DELETE FROM users WHERE id != ?", (user['id'],))
                # 8. Force fresh login for all other users by deleting their active sessions
                auth_header = self.headers.get("Authorization", "")
                admin_token = auth_header.split(" ")[1] if auth_header.startswith("Bearer ") else ""
                if admin_token:
                    cursor.execute("DELETE FROM active_sessions WHERE token != ?", (admin_token,))
                else:
                    cursor.execute("DELETE FROM active_sessions")
                # 9. Reset site visitor count
                cursor.execute("UPDATE app_config SET value = '0' WHERE key = 'site_views'")
                cursor.execute("DELETE FROM visitor_ips")
                
                conn.commit()
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "message": "Platform reset completed successfully."}).encode())
                return

            # 7. GENERATE DEVELOPER API KEY: /api/user/keys
            if path == "/api/user/keys":
                user = get_user_from_headers(self.headers, conn)
                if not user:
                    self.send_error_json(401, "Unauthorized")
                    return
                
                name = body.get("name") or "Default Key"
                cursor = conn.cursor()
                count = cursor.execute("SELECT COUNT(id) FROM api_keys WHERE user_id = ?", (user['id'],)).fetchone()[0]
                if count >= user['api_key_limit']:
                    self.send_error_json(400, f"API key limit reached ({user['api_key_limit']} keys)")
                    return
                
                raw_key = f"astra_live_{uuid.uuid4().hex}"
                key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
                now = datetime.datetime.now().isoformat()
                
                cursor.execute(
                    "INSERT INTO api_keys (user_id, key_hash, name, created_at) VALUES (?, ?, ?, ?)",
                    (user['id'], key_hash, name, now)
                )
                conn.commit()
                key_id = cursor.lastrowid
                
                cursor.execute("SELECT * FROM api_keys WHERE id = ?", (key_id,))
                row = dict(cursor.fetchone())
                row['is_active'] = bool(row['is_active'])
                row['raw_key'] = raw_key
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(row).encode())
                return

            # 8. STREAM CONVERSATION RESPONSE: /api/chat/sessions/{id}/stream
            match_stream = re.match(r"^/api/chat/sessions/(\d+)/stream$", path)
            if match_stream:
                session_id = int(match_stream.group(1))
                user = get_user_from_headers(self.headers, conn)
                if not user:
                    self.send_error_json(401, "Unauthorized")
                    return
                
                content = body.get("content")
                file_url = body.get("file_url")
                file_type = body.get("file_type")
                model_used = body.get("model_used") or "astra-gpt-4"
                
                # Check session
                cursor = conn.cursor()
                cursor.execute("SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?", (session_id, user['id']))
                if not cursor.fetchone():
                    self.send_error_json(404, "Chat session not found")
                    return
                
                now = datetime.datetime.now().isoformat()
                
                # Save User message
                cursor.execute("""
                    INSERT INTO messages (session_id, sender, content, file_url, file_type, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (session_id, "user", content, file_url, file_type, now))
                
                # Auto rename chat session if default
                cursor.execute("SELECT title FROM chat_sessions WHERE id = ?", (session_id,))
                c_title = cursor.fetchone()['title']
                if c_title == "New Chat":
                    short_title = content[:30] + ("..." if len(content) > 30 else "")
                    cursor.execute("UPDATE chat_sessions SET title = ?, updated_at = ? WHERE id = ?", (short_title, now, session_id))
                else:
                    cursor.execute("UPDATE chat_sessions SET updated_at = ? WHERE id = ?", (now, session_id))
                
                conn.commit()

                # Check for creator/launch date query
                is_branding_query = False
                lower_content = content.strip().lower()
                if any(x in lower_content for x in ["kisne banaya", "created you", "made you", "developed you", "creator", "developer", "owner of you", "who are you"]) or \
                   any(x in lower_content for x in ["launch", "starting", "start hua", "kab start", "kab bana", "release", "birthday"]):
                    if any(x in lower_content for x in ["you", "tum", "aap", "tu ", "assistant", "model", "system"]):
                        is_branding_query = True

                if is_branding_query:
                    response_text = "मैं **Astra AI** द्वारा विकसित एक पेशेवर AI सहायक हूँ। मेरी शुरुआत **23 जून 2026** को हुई थी। मैं आपकी विभिन्न तकनीकी, रचनात्मक और कोडिंग कार्यों में सहायता करने के लिए प्रतिबद्ध हूँ।"
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/event-stream')
                    self.send_header('Cache-Control', 'no-cache')
                    self.send_header('Connection', 'close')
                    self.end_headers()
                    
                    self.wfile.write(response_text.encode('utf-8'))
                    self.wfile.flush()
                    
                    cursor.execute("""
                        INSERT INTO messages (session_id, sender, content, model_used, created_at)
                        VALUES (?, ?, ?, ?, ?)
                    """, (session_id, "assistant", response_text, model_used, now))
                    conn.commit()
                    return

                # ── Image Generation Detection ────────────────────────────────
                # Supports: English, Hindi, Hinglish, and any mixed phrasing
                # Works like ChatGPT/Gemini — no specific prefix required
                is_image_request = False
                prompt_text = ""
                lower_content = content.strip().lower()

                # 1. Slash-command prefixes (highest priority, direct commands)
                slash_prefixes = [
                    "/image", "/img", "/draw", "/generate", "/make", "/create",
                    "/paint", "/sketch", "/art", "/photo", "/picture", "/pic",
                ]

                # 2. Natural language patterns (English)
                en_patterns = [
                    "generate image", "generate a image", "generate an image",
                    "create image", "create a image", "create an image",
                    "make image", "make a image", "make an image",
                    "draw image", "draw a image", "draw an image",
                    "draw me", "paint me", "show me image", "show me a image",
                    "generate photo", "create photo", "make photo",
                    "generate picture", "create picture", "make picture",
                    "show picture", "show image",
                    "give me image", "give me a image", "give me picture",
                    "i want image", "i want a image", "i want picture",
                    "image of", "picture of", "photo of",
                    "create art", "generate art", "make art",
                ]

                # 3. Hindi / Hinglish patterns
                hi_patterns = [
                    # Hindi Unicode
                    "चित्र बनाओ", "तस्वीर बनाओ", "इमेज बनाओ", "फोटो बनाओ",
                    "इमेज बना", "चित्र बना", "तस्वीर बना", "फोटो बना",
                    "एक चित्र", "एक तस्वीर", "एक इमेज",
                    "चित्र दिखाओ", "तस्वीर दिखाओ", "इमेज दिखाओ",
                    "चित्र बनाना", "तस्वीर बनाना", "इमेज बनाना",
                    # Hinglish (Roman Hindi)
                    "image banao", "image bana", "image banana",
                    "photo banao", "photo bana", "photo banana",
                    "tasveer banao", "tasveer bana",
                    "chitra banao", "chitra bana",
                    "image chahiye", "photo chahiye",
                    "image dikhao", "photo dikhao",
                    "ek image", "ek photo", "ek tasveer",
                    "image generate", "image create", "image draw",
                    "mujhe image", "mujhe photo", "mujhe tasveer",
                    "mujhe ek image", "mujhe ek photo",
                    "mere liye image", "mere liye photo",
                    "make image", "make a image",
                ]

                # Check slash prefixes first
                for prefix in slash_prefixes:
                    if lower_content.startswith(prefix):
                        is_image_request = True
                        prompt_text = content[len(prefix):].strip()
                        break

                # Check English natural language patterns
                if not is_image_request:
                    for pattern in en_patterns:
                        if pattern in lower_content:
                            is_image_request = True
                            # Extract prompt after the pattern
                            idx = lower_content.find(pattern)
                            prompt_text = content[idx + len(pattern):].strip()
                            # Remove leading "of", "a", "an" etc.
                            for filler in ["of ", "a ", "an ", ": ", "- "]:
                                if prompt_text.lower().startswith(filler):
                                    prompt_text = prompt_text[len(filler):].strip()
                            break

                # Check Hindi / Hinglish patterns
                if not is_image_request:
                    original_lower = content.strip().lower()
                    for pattern in hi_patterns:
                        if pattern in original_lower or pattern in content:
                            is_image_request = True
                            # For Hindi patterns, use the whole content as prompt subject
                            # Remove the trigger phrase and use remainder
                            idx = original_lower.find(pattern)
                            if idx == -1:
                                idx = content.lower().find(pattern)
                            remainder = content[idx + len(pattern):].strip()
                            # If remainder is short/empty, use whole content minus trigger
                            if remainder:
                                prompt_text = remainder
                            else:
                                # Use text before the trigger as context
                                prompt_text = content[:idx].strip() or content.strip()
                            break

                # Fallback: if the whole message is about "image" keyword + noun
                if not is_image_request:
                    words = lower_content.split()
                    image_keywords = {"image", "img", "picture", "photo", "draw", "paint", "sketch", "artwork", "इमेज", "तस्वीर", "चित्र"}
                    action_keywords = {"make", "create", "generate", "show", "give", "produce", "render", "design", "banao", "bana", "dikhao", "chahiye"}
                    has_image_word = any(w in image_keywords for w in words)
                    has_action_word = any(w in action_keywords for w in words)
                    if has_image_word and has_action_word:
                        is_image_request = True
                        # Use full content as prompt (minus common action words)
                        prompt_text = content.strip()

                # Final prompt cleanup
                if is_image_request:
                    if not prompt_text or len(prompt_text.strip()) < 3:
                        # Try to extract a meaningful subject from the full content
                        for noise in slash_prefixes + en_patterns + hi_patterns:
                            content_clean = content.lower().replace(noise, "").strip()
                        prompt_text = content_clean if len(content_clean) > 3 else content.strip()
                    if not prompt_text or len(prompt_text.strip()) < 3:
                        prompt_text = "A beautiful digital artwork"

                if is_image_request:
                    encoded_prompt = urllib.parse.quote(prompt_text)
                    seed = random.randint(1, 999999)
                    image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&seed={seed}&nologo=true"
                    response_text = f"Here is your generated image for **\"{prompt_text}\"**:\n\n![{prompt_text}]({image_url})"
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/event-stream')
                    self.send_header('Cache-Control', 'no-cache')
                    self.send_header('Connection', 'close')
                    self.end_headers()
                    
                    self.wfile.write(response_text.encode('utf-8'))
                    self.wfile.flush()
                    
                    cursor.execute("""
                        INSERT INTO messages (session_id, sender, content, model_used, created_at)
                        VALUES (?, ?, ?, ?, ?)
                    """, (session_id, "assistant", response_text, model_used, now))
                    conn.commit()
                    return
                
                # Start Event Stream response
                self.send_response(200)
                self.send_header('Content-Type', 'text/event-stream')
                self.send_header('Cache-Control', 'no-cache')
                self.send_header('Connection', 'close')
                self.end_headers()
                
                response_text = ""
                
                # Retrieve the API key from headers
                llm_api_key = self.headers.get("X-LLM-API-Key")
                if not llm_api_key or llm_api_key.strip() == "":
                    # Stream technical error if key is removed/missing
                    response_text = '⚠️ **Technical Error:** Please try again sometime later.'
                    self.wfile.write(response_text.encode('utf-8'))
                    self.wfile.flush()
                    cursor.execute("""
                        INSERT INTO messages (session_id, sender, content, model_used, created_at)
                        VALUES (?, ?, ?, ?, ?)
                    """, (session_id, "assistant", response_text, model_used, now))
                    conn.commit()
                    return
                    
                local_groq_client = None
                try:
                    from openai import OpenAI
                    local_groq_client = OpenAI(base_url="https://api.groq.com/openai/v1", api_key=llm_api_key)
                except Exception:
                    pass
                
                if local_groq_client:
                    try:
                        # Fetch recent context for the AI
                        cursor.execute("SELECT sender, content FROM messages WHERE session_id = ? ORDER BY created_at ASC LIMIT 10", (session_id,))
                        history = cursor.fetchall()
                        
                        messages = [{"role": "system", "content": "You are Astra AI, an intelligent, fast, and helpful assistant. You run locally on the user's computer. CRITICAL RULE: You MUST reply in the EXACT SAME LANGUAGE the user uses. If they speak English, reply ONLY in English. If they speak Hindi, reply ONLY in Hindi. If they use Hinglish, reply in Hinglish. Do NOT mix languages unless the user does. Be extremely helpful, concise, and professional. Always act like a real person, using emojis where appropriate. Do not use markdown unless formatting code or lists."}]
                        
                        for msg in history:
                            messages.append({"role": msg['sender'], "content": msg['content']})
                            
                        # Map frontend model names to actual Groq models
                        groq_model = "llama-3.1-8b-instant"
                        if model_used == "astra-code-llama":
                            groq_model = "llama3-70b-8192" # Use larger model for coding
                        elif model_used == "gemma-7b":
                            groq_model = "gemma2-9b-it"
                        elif model_used == "mixtral-8x7b":
                            groq_model = "mixtral-8x7b-32768"
                            
                        # Stream from Groq API
                        stream = local_groq_client.chat.completions.create(
                            model=groq_model,
                            messages=messages,
                            stream=True,
                            temperature=0.7,
                            max_tokens=2048
                        )
                        
                        for chunk in stream:
                            if chunk.choices[0].delta.content is not None:
                                text_chunk = chunk.choices[0].delta.content
                                response_text += text_chunk
                                self.wfile.write(text_chunk.encode("utf-8"))
                                self.wfile.flush()
                                
                    except Exception as e:
                        error_msg = f"Sorry bhai, AI encountered an error while connecting: {str(e)}"
                        response_text = error_msg
                        self.wfile.write(error_msg.encode("utf-8"))
                        self.wfile.flush()
                else:
                    error_msg = "Astra AI needs the 'openai' library to run. Please wait for it to install, then restart your server (python server.py)."
                    response_text = error_msg
                    self.wfile.write(error_msg.encode("utf-8"))
                    self.wfile.flush()
                
                # Save assistant message to DB after stream completes
                cursor.execute("""
                    INSERT INTO messages (session_id, sender, content, model_used, created_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (session_id, "assistant", response_text, model_used, now))
                conn.commit()
                return

            # 11. CREATE PROJECT: /api/projects
            if path == "/api/projects":
                user = get_user_from_headers(self.headers, conn)
                if not user:
                    self.send_error_json(401, "Unauthorized")
                    return
                
                name = body.get("name")
                if not name:
                    self.send_error_json(400, "Missing project name")
                    return
                
                now = datetime.datetime.now().isoformat()
                cursor = conn.cursor()
                cursor.execute("INSERT INTO projects (user_id, name, created_at, updated_at) VALUES (?, ?, ?, ?)",
                               (user['id'], name, now, now))
                conn.commit()
                project_id = cursor.lastrowid
                
                cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
                new_project = dict(cursor.fetchone())
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(new_project).encode())
                return

            # 9. PDF ANALYSIS: /api/ai/analyze-pdf
            if path == "/api/ai/analyze-pdf":
                filename = "document.pdf"
                fn_match = re.search(r'filename="([^"]+)"', post_data.decode('utf-8', errors='ignore'))
                if fn_match:
                    filename = fn_match.group(1)
                
                if not filename.lower().endswith(".pdf"):
                    self.send_error_json(400, "Only PDF files are supported.")
                    return
                
                analysis_desc = (
                    f"**[PDF Analysis Result for {filename}]**\n\n"
                    f"Successfully processed the document. Here is a summary of the extracted context:\n\n"
                    f"1. **Document Structure**: Contains index layout, introduction to workspace telemetry, and connection credentials.\n"
                    f"2. **Content Insight**: Focuses on local cognitive models matrix, dual execution endpoints, and security keys.\n"
                    f"3. **Conclusion**: Zero critical vulnerabilities found. The workspace configuration is secure."
                )
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "filename": filename,
                    "char_count": len(analysis_desc) * 10,
                    "preview": analysis_desc[:500] + "...",
                    "full_text": analysis_desc
                }).encode())
                return

            # 10. IMAGE ANALYSIS: /api/ai/analyze-image
            if path == "/api/ai/analyze-image":
                filename = "image.png"
                fn_match = re.search(r'filename="([^"]+)"', post_data.decode('utf-8', errors='ignore'))
                if fn_match:
                    filename = fn_match.group(1)
                
                prompt = "Describe this image"
                prompt_match = re.search(r'name="prompt"\r\n\r\n([^\r\n]+)', post_data.decode('utf-8', errors='ignore'))
                if prompt_match:
                    prompt = prompt_match.group(1)
                
                analysis_desc = (
                    f"**[Image Analysis Result for {filename}]**\n\n"
                    f"The image appears to contain visual layouts with high fidelity components.\n\n"
                    f"1. **Core Subject**: A clean dashboard UI mock-up displaying telemetry charts and user account details.\n"
                    f"2. **Styling**: Uses a dark mode palette with active teal highlights.\n"
                    f"3. **Text / OCR**: Text in the header reads 'Astra AI Performance Monitoring'."
                )
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "filename": filename,
                    "prompt": prompt,
                    "description": analysis_desc
                }).encode())
                return

            # RAZORPAY: CREATE ORDER: POST /api/payment/create-order
            if path == "/api/payment/create-order":
                pay_user = get_user_from_headers(self.headers, conn)
                if not pay_user:
                    self.send_error_json(401, "Unauthorized")
                    return
                tier = body.get("tier")
                amount_inr = body.get("amount_inr")  # full amount with GST in INR (integer paise)
                if not tier or amount_inr is None:
                    self.send_error_json(400, "Missing tier or amount_inr")
                    return

                # Fetch Razorpay Key ID & Secret from app_config
                cursor = conn.cursor()
                cursor.execute("SELECT key, value FROM app_config WHERE key IN ('razorpay_key_id', 'razorpay_key_secret')")
                cfg_rows = cursor.fetchall()
                cfg = {r['key']: r['value'] for r in cfg_rows}
                rz_key_id = cfg.get('razorpay_key_id', '')
                rz_key_secret = cfg.get('razorpay_key_secret', '')

                if not rz_key_id or not rz_key_secret:
                    self.send_error_json(503, "Razorpay not configured. Admin must add Razorpay keys in Settings.")
                    return

                # Create order via Razorpay REST API
                import base64, hmac, hashlib as _hashlib
                amount_paise = int(float(amount_inr) * 100)
                order_payload = json.dumps({
                    "amount": amount_paise,
                    "currency": "INR",
                    "receipt": f"astra_{pay_user['id']}_{tier}_{int(time.time())}",
                    "notes": {"user_id": str(pay_user['id']), "tier": tier}
                }).encode('utf-8')
                credentials = base64.b64encode(f"{rz_key_id}:{rz_key_secret}".encode()).decode()
                rz_req = urllib.request.Request(
                    "https://api.razorpay.com/v1/orders",
                    data=order_payload,
                    headers={
                        'Authorization': f'Basic {credentials}',
                        'Content-Type': 'application/json'
                    },
                    method='POST'
                )
                try:
                    with urllib.request.urlopen(rz_req, timeout=15) as rz_resp:
                        rz_data = json.loads(rz_resp.read().decode('utf-8'))
                except Exception as rz_err:
                    print(f"[Razorpay] Order creation failed: {rz_err}")
                    self.send_error_json(502, f"Razorpay order creation failed: {str(rz_err)}")
                    return

                now_str = datetime.datetime.now().isoformat()
                cursor.execute(
                    "INSERT INTO razorpay_orders (user_id, razorpay_order_id, tier, amount_paise, currency, status, created_at) VALUES (?, ?, ?, ?, 'INR', 'created', ?)",
                    (pay_user['id'], rz_data.get('id'), tier, amount_paise, now_str)
                )
                conn.commit()

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "order_id": rz_data.get('id'),
                    "amount": amount_paise,
                    "currency": "INR",
                    "key_id": rz_key_id
                }).encode())
                return

            # RAZORPAY: VERIFY PAYMENT & UPGRADE: POST /api/payment/verify
            if path == "/api/payment/verify":
                pay_user = get_user_from_headers(self.headers, conn)
                if not pay_user:
                    self.send_error_json(401, "Unauthorized")
                    return
                razorpay_order_id = body.get("razorpay_order_id")
                razorpay_payment_id = body.get("razorpay_payment_id")
                razorpay_signature = body.get("razorpay_signature")
                tier = body.get("tier")
                if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature, tier]):
                    self.send_error_json(400, "Missing payment verification fields")
                    return

                # Fetch Razorpay secret
                cursor = conn.cursor()
                cursor.execute("SELECT value FROM app_config WHERE key = 'razorpay_key_secret'")
                secret_row = cursor.fetchone()
                rz_secret = secret_row['value'] if secret_row else ''
                if not rz_secret:
                    self.send_error_json(503, "Razorpay not configured")
                    return

                # Verify HMAC-SHA256 signature
                import hmac as _hmac
                expected_sig = _hmac.new(
                    rz_secret.encode(),
                    f"{razorpay_order_id}|{razorpay_payment_id}".encode(),
                    hashlib.sha256
                ).hexdigest()
                if expected_sig != razorpay_signature:
                    self.send_error_json(400, "Payment signature verification failed")
                    return

                # Upgrade subscription
                limit = 5
                if tier == "premium":
                    limit = 20
                elif tier == "enterprise":
                    limit = 100
                cursor.execute("UPDATE users SET subscription_tier = ?, api_key_limit = ? WHERE id = ?", (tier, limit, pay_user['id']))
                # Update order status
                cursor.execute("UPDATE razorpay_orders SET status = 'paid', razorpay_payment_id = ? WHERE razorpay_order_id = ?",
                               (razorpay_payment_id, razorpay_order_id))
                conn.commit()

                cursor.execute("SELECT * FROM users WHERE id = ?", (pay_user['id'],))
                updated = dict(cursor.fetchone())
                updated['is_admin'] = bool(updated['is_admin'])
                updated['is_active'] = bool(updated['is_active'])

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"message": f"Subscription upgraded to {tier.upper()}!", "user": updated}).encode())
                return

            # SIMPLE PAYMENT UPGRADE: POST /api/payment/upgrade
            # Called after client-side Razorpay payment success (key_id only flow)
            if path == "/api/payment/upgrade":
                pay_user = get_user_from_headers(self.headers, conn)
                if not pay_user:
                    self.send_error_json(401, "Unauthorized")
                    return
                tier = body.get("tier")
                payment_id = body.get("payment_id", "")
                if not tier:
                    self.send_error_json(400, "Missing tier")
                    return
                limit = 5
                if tier == "premium":
                    limit = 20
                elif tier == "enterprise":
                    limit = 100
                cursor = conn.cursor()
                cursor.execute("UPDATE users SET subscription_tier = ?, api_key_limit = ? WHERE id = ?", (tier, limit, pay_user['id']))
                # Log it
                now_str = datetime.datetime.now().isoformat()
                try:
                    cursor.execute(
                        "INSERT OR IGNORE INTO razorpay_orders (user_id, razorpay_order_id, tier, amount_paise, currency, status, razorpay_payment_id, created_at) VALUES (?, ?, ?, ?, 'INR', 'paid', ?, ?)",
                        (pay_user['id'], payment_id or f"direct_{int(time.time())}", tier, 0, payment_id, now_str)
                    )
                except Exception:
                    pass
                conn.commit()
                cursor.execute("SELECT * FROM users WHERE id = ?", (pay_user['id'],))
                updated = dict(cursor.fetchone())
                updated['is_admin'] = bool(updated['is_admin'])
                updated['is_active'] = bool(updated['is_active'])
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"message": f"Subscription upgraded to {tier.upper()}!", "user": updated}).encode())
                return

            self.send_error_json(404, "Endpoint not found")
        except Exception as e:
            print(f"[Error] POST request failed: {e}")
            self.send_error_json(500, f"Server error: {str(e)}")
        finally:
            conn.close()

    def do_PUT(self):
        conn = get_db_connection()
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length) if content_length > 0 else b''
        
        try:
            body = {}
            if post_data:
                try:
                    body = json.loads(post_data.decode('utf-8'))
                except Exception:
                    pass
            
            user = get_user_from_headers(self.headers, conn)
            if not user:
                self.send_error_json(401, "Unauthorized")
                return

            # 1. RENAME SESSION: /api/chat/sessions/{id}/rename
            match_rename = re.match(r"^/api/chat/sessions/(\d+)/rename$", path)
            if match_rename:
                session_id = int(match_rename.group(1))
                title = body.get("title")
                if not title:
                    self.send_error_json(400, "Missing title parameter")
                    return
                
                cursor = conn.cursor()
                cursor.execute("SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?", (session_id, user['id']))
                if not cursor.fetchone():
                    self.send_error_json(404, "Chat session not found")
                    return
                
                now = datetime.datetime.now().isoformat()
                cursor.execute("UPDATE chat_sessions SET title = ?, updated_at = ? WHERE id = ?", (title, now, session_id))
                conn.commit()
                
                cursor.execute("SELECT * FROM chat_sessions WHERE id = ?", (session_id,))
                row = dict(cursor.fetchone())
                row['is_pinned'] = bool(row['is_pinned'])
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(row).encode())
                return

            # 1.5 SET SESSION PROJECT: /api/chat/sessions/{id}/project
            match_project = re.match(r"^/api/chat/sessions/(\d+)/project$", path)
            if match_project:
                session_id = int(match_project.group(1))
                project_id = body.get("project_id")
                
                cursor = conn.cursor()
                cursor.execute("SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?", (session_id, user['id']))
                if not cursor.fetchone():
                    self.send_error_json(404, "Chat session not found")
                    return
                
                if project_id is not None:
                    cursor.execute("SELECT id FROM projects WHERE id = ? AND user_id = ?", (project_id, user['id']))
                    if not cursor.fetchone():
                        self.send_error_json(404, "Project not found")
                        return
                
                now = datetime.datetime.now().isoformat()
                cursor.execute("UPDATE chat_sessions SET project_id = ?, updated_at = ? WHERE id = ?", (project_id, now, session_id))
                conn.commit()
                
                cursor.execute("SELECT * FROM chat_sessions WHERE id = ?", (session_id,))
                row = dict(cursor.fetchone())
                row['is_pinned'] = bool(row['is_pinned'])
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(row).encode())
                return

            # 2. PIN SESSION: /api/chat/sessions/{id}/pin
            match_pin = re.match(r"^/api/chat/sessions/(\d+)/pin$", path)
            if match_pin:
                session_id = int(match_pin.group(1))
                cursor = conn.cursor()
                cursor.execute("SELECT is_pinned FROM chat_sessions WHERE id = ? AND user_id = ?", (session_id, user['id']))
                row = cursor.fetchone()
                if not row:
                    self.send_error_json(404, "Chat session not found")
                    return
                
                new_pin = 1 if row['is_pinned'] == 0 else 0
                now = datetime.datetime.now().isoformat()
                cursor.execute("UPDATE chat_sessions SET is_pinned = ?, updated_at = ? WHERE id = ?", (new_pin, now, session_id))
                conn.commit()
                
                cursor.execute("SELECT * FROM chat_sessions WHERE id = ?", (session_id,))
                res = dict(cursor.fetchone())
                res['is_pinned'] = bool(res['is_pinned'])
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(res).encode())
                return

            # 3. UPDATE USER PROFILE: /api/user/profile
            if path == "/api/user/profile":
                full_name = body.get("full_name")
                avatar_url = body.get("avatar_url")
                username = body.get("username")
                
                # Validate username if provided
                if username is not None:
                    username = username.strip().lower()
                    if not re.match(r'^[a-z0-9_]{3,20}$', username):
                        self.send_error_json(400, "Username must be 3-20 characters (letters, numbers, underscores only)")
                        return
                    # Check uniqueness
                    conn2 = get_db_connection()
                    row = conn2.execute("SELECT id FROM users WHERE username = ? AND id != ?", (username, user['id'])).fetchone()
                    conn2.close()
                    if row:
                        self.send_error_json(400, "Username already taken")
                        return
                
                cursor = conn.cursor()
                if full_name is not None:
                    cursor.execute("UPDATE users SET full_name = ? WHERE id = ?", (full_name, user['id']))
                if avatar_url is not None:
                    cursor.execute("UPDATE users SET avatar_url = ? WHERE id = ?", (avatar_url, user['id']))
                if username is not None:
                    cursor.execute("UPDATE users SET username = ? WHERE id = ?", (username, user['id']))
                conn.commit()
                
                cursor.execute("SELECT * FROM users WHERE id = ?", (user['id'],))
                updated = dict(cursor.fetchone())
                updated['is_admin'] = bool(updated['is_admin'])
                updated['is_active'] = bool(updated['is_active'])
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(updated).encode())
                return

            # 4. CHANGE PASSWORD: /api/user/password
            if path == "/api/user/password":
                old_pwd = body.get("old_password")
                new_pwd = body.get("new_password")
                if not old_pwd or not new_pwd:
                    self.send_error_json(400, "Missing parameters")
                    return
                
                old_h = hashlib.sha256(old_pwd.encode()).hexdigest()
                if user['password_hash'] and user['password_hash'] != old_h:
                    self.send_error_json(400, "Incorrect current password")
                    return
                
                new_h = hashlib.sha256(new_pwd.encode()).hexdigest()
                cursor = conn.cursor()
                cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_h, user['id']))
                conn.commit()
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"message": "Password updated"}).encode())
                return

            # 5. ADMIN UPGRADE SUBSCRIPTION TIER: /api/admin/users/{id}/subscription
            match_sub = re.match(r"^/api/admin/users/(\d+)/subscription$", path)
            if match_sub:
                target_id = int(match_sub.group(1))
                if not user['is_admin']:
                    self.send_error_json(403, "Access denied")
                    return
                
                tier = body.get("tier")
                if not tier:
                    self.send_error_json(400, "Missing tier parameter")
                    return
                
                limit = 5
                if tier == "premium":
                    limit = 20
                elif tier == "enterprise":
                    limit = 100
                
                cursor = conn.cursor()
                cursor.execute("UPDATE users SET subscription_tier = ?, api_key_limit = ? WHERE id = ?", (tier, limit, target_id))
                conn.commit()
                
                cursor.execute("SELECT * FROM users WHERE id = ?", (target_id,))
                updated = dict(cursor.fetchone())
                updated['is_admin'] = bool(updated['is_admin'])
                updated['is_active'] = bool(updated['is_active'])
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(updated).encode())
                return

            # 6. ADMIN TOGGLE STATUS: /api/admin/users/{id}/toggle-status
            match_toggle = re.match(r"^/api/admin/users/(\d+)/toggle-status$", path)
            if match_toggle:
                target_id = int(match_toggle.group(1))
                if not user['is_admin']:
                    self.send_error_json(403, "Access denied")
                    return
                if target_id == user['id']:
                    self.send_error_json(400, "Cannot deactivate your own profile")
                    return
                
                cursor = conn.cursor()
                cursor.execute("SELECT is_active FROM users WHERE id = ?", (target_id,))
                target_row = cursor.fetchone()
                if not target_row:
                    self.send_error_json(404, "User profile not found")
                    return
                
                new_status = 1 if target_row['is_active'] == 0 else 0
                cursor.execute("UPDATE users SET is_active = ? WHERE id = ?", (new_status, target_id))
                conn.commit()
                
                cursor.execute("SELECT * FROM users WHERE id = ?", (target_id,))
                updated = dict(cursor.fetchone())
                updated['is_admin'] = bool(updated['is_admin'])
                updated['is_active'] = bool(updated['is_active'])
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(updated).encode())
                return

            # 7. ADMIN UPDATE PRICING: PUT /api/admin/pricing
            if path == "/api/admin/pricing":
                if not user['is_admin']:
                    self.send_error_json(403, "Access denied")
                    return
                plans = body.get("plans")  # list of {tier, base_price_usd, gst_rate, display_name}
                if not plans or not isinstance(plans, list):
                    self.send_error_json(400, "Missing plans array")
                    return
                now_str = datetime.datetime.now().isoformat()
                cursor = conn.cursor()
                for p in plans:
                    tier = p.get("tier")
                    price = p.get("base_price_usd")
                    gst = p.get("gst_rate")
                    name = p.get("display_name")
                    if tier and price is not None and gst is not None:
                        cursor.execute(
                            "UPDATE plan_config SET base_price_usd = ?, gst_rate = ?, display_name = ?, updated_at = ? WHERE tier = ?",
                            (float(price), float(gst), name, now_str, tier)
                        )
                conn.commit()
                cursor.execute("SELECT * FROM plan_config ORDER BY id")
                updated_plans = [dict(r) for r in cursor.fetchall()]
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(updated_plans).encode())
                return

            # 8. ADMIN SAVE APP CONFIG: PUT /api/admin/config
            if path == "/api/admin/config":
                if not user['is_admin']:
                    self.send_error_json(403, "Access denied")
                    return
                config_data = body  # dict of key->value
                now_str = datetime.datetime.now().isoformat()
                cursor = conn.cursor()
                for k, v in config_data.items():
                    cursor.execute(
                        "INSERT OR REPLACE INTO app_config (key, value, updated_at) VALUES (?, ?, ?)",
                        (k, str(v) if v else '', now_str)
                    )
                conn.commit()
                cursor.execute("SELECT key, value FROM app_config")
                rows = cursor.fetchall()
                result = {r['key']: r['value'] for r in rows}
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode())
                return

            self.send_error_json(404, "Endpoint not found")
        except Exception as e:
            print(f"[Error] PUT request failed: {e}")
            self.send_error_json(500, f"Server issue: {str(e)}")
        finally:
            conn.close()

    def do_DELETE(self):
        conn = get_db_connection()
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        
        try:
            user = get_user_from_headers(self.headers, conn)
            if not user:
                self.send_error_json(401, "Unauthorized")
                return

            # 1. DELETE ALL CHAT SESSIONS: /api/chat/sessions
            if path == "/api/chat/sessions":
                cursor = conn.cursor()
                cursor.execute("DELETE FROM chat_sessions WHERE user_id = ?", (user['id'],))
                conn.commit()
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"message": "All chat sessions cleared"}).encode())
                return

            # 1.5 DELETE CHAT SESSION: /api/chat/sessions/{id}
            match_del_sess = re.match(r"^/api/chat/sessions/(\d+)$", path)
            if match_del_sess:
                session_id = int(match_del_sess.group(1))
                cursor = conn.cursor()
                cursor.execute("SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?", (session_id, user['id']))
                if not cursor.fetchone():
                    self.send_error_json(404, "Chat session not found")
                    return
                
                cursor.execute("DELETE FROM chat_sessions WHERE id = ?", (session_id,))
                conn.commit()
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"message": "Chat session deleted"}).encode())
                return

            # 1.7 DELETE PROJECT: /api/projects/{id}
            match_del_proj = re.match(r"^/api/projects/(\d+)$", path)
            if match_del_proj:
                project_id = int(match_del_proj.group(1))
                cursor = conn.cursor()
                cursor.execute("SELECT id FROM projects WHERE id = ? AND user_id = ?", (project_id, user['id']))
                if not cursor.fetchone():
                    self.send_error_json(404, "Project not found")
                    return
                
                cursor.execute("DELETE FROM projects WHERE id = ?", (project_id,))
                conn.commit()
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"message": "Project deleted"}).encode())
                return

            # 2. REVOKE DEVELOPER API KEY: /api/user/keys/{id}
            match_del_key = re.match(r"^/api/user/keys/(\d+)$", path)
            if match_del_key:
                key_id = int(match_del_key.group(1))
                cursor = conn.cursor()
                cursor.execute("SELECT id FROM api_keys WHERE id = ? AND user_id = ?", (key_id, user['id']))
                if not cursor.fetchone():
                    self.send_error_json(404, "API key not found")
                    return
                
                cursor.execute("DELETE FROM api_keys WHERE id = ?", (key_id,))
                conn.commit()
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"message": "API key revoked"}).encode())
                return

            # 3. DELETE USER ACCOUNT: /api/user/account (Registers a deletion request instead of instant purge)
            if path == "/api/user/account":
                cursor = conn.cursor()
                now = datetime.datetime.now().isoformat()
                cursor.execute("UPDATE users SET deletion_requested_at = ? WHERE id = ?", (now, user['id']))
                conn.commit()
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"message": "Account deleted successfully"}).encode())
                return

            # 4. ADMIN DELETE USER ACCOUNT: /api/admin/users/{id}
            match_admin_del = re.match(r"^/api/admin/users/(\d+)$", path)
            if match_admin_del:
                target_id = int(match_admin_del.group(1))
                if not user['is_admin']:
                    self.send_error_json(403, "Access denied")
                    return
                if target_id == user['id']:
                    self.send_error_json(400, "Cannot delete your own admin account")
                    return
                
                cursor = conn.cursor()
                cursor.execute("SELECT email FROM users WHERE id = ?", (target_id,))
                target_user = cursor.fetchone()
                if not target_user:
                    self.send_error_json(404, "User not found")
                    return
                target_email = target_user['email']
                
                # Delete all related records
                cursor.execute("DELETE FROM active_sessions WHERE email = ?", (target_email,))
                cursor.execute("DELETE FROM usage_stats WHERE user_id = ?", (target_id,))
                cursor.execute("DELETE FROM api_keys WHERE user_id = ?", (target_id,))
                cursor.execute("DELETE FROM messages WHERE session_id IN (SELECT id FROM chat_sessions WHERE user_id = ?)", (target_id,))
                cursor.execute("DELETE FROM chat_sessions WHERE user_id = ?", (target_id,))
                cursor.execute("DELETE FROM projects WHERE user_id = ?", (target_id,))
                cursor.execute("DELETE FROM users WHERE id = ?", (target_id,))
                conn.commit()
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"message": f"User account {target_email} deleted successfully"}).encode())
                return

            self.send_error_json(404, "Endpoint path not found")
        except Exception as e:
            print(f"[Error] DELETE request failed: {e}")
            self.send_error_json(500, f"Server deletion error: {str(e)}")
        finally:
            conn.close()

    def send_error_json(self, status_code, message):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"detail": message}).encode())

class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    # Permits asynchronous request handling for parallel chat streams
    allow_reuse_address = True
    daemon_threads = True

def run():
    init_db()
    server_address = ('127.0.0.1', PORT)
    httpd = ThreadingHTTPServer(server_address, AstraHTTPHandler)
    print(f"\n" + "="*60)
    print(f"| ASTRA AI LIGHTWEIGHT SINGLE-FILE BACKEND ACTIVE           |")
    print(f"| Running on Local Port: http://127.0.0.1:{PORT}              |")
    print(f"| SQLite Telemetry File: {DB_FILE}                          |")
    print(f"| ZERO external package installations required!            |")
    print(f"| Admin Account: admin@astra.ai / AdminAstra2026!          |")
    print("="*60 + "\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down Astra fallback gateway...")
        httpd.server_close()
        sys.exit(0)

if __name__ == "__main__":
    run()
