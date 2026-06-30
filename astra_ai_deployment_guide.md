# 🚀 Astra AI — Complete Project + Deployment Guide

## 📁 PART 1: Project Structure — Kaun Sa Folder Kya Karta Hai

```
Astra-AI/
├── frontend/          ← React + Vite (User ka browser me chalega)
├── backend/           ← Python FastAPI (Server pe chalega)
├── netlify.toml       ← Netlify config for frontend
├── docker-compose.yml ← Local development (PostgreSQL + backend together)
├── init-db.sql        ← Database schema seed file
└── .gitignore
```

---

### 🎨 FRONTEND (`frontend/`)

**Kya hai:** React (Vite) app — user jo kuch bhi dekha aur click karta hai woh yahan hai.

| File/Folder | Kya karta hai |
|---|---|
| `src/pages/LandingPage.jsx` | Home page — hero, features, demo, pricing, FAQ |
| `src/pages/DashboardPage.jsx` | Main AI chat interface (151KB — sabse bada file!) |
| `src/pages/AuthPages.jsx` | Login, Register, OTP pages |
| `src/pages/AdminDashboardPage.jsx` | Admin panel (stats, users, etc.) |
| `src/pages/ProfileSettingsPages.jsx` | User profile settings |
| `src/pages/StaticPages.jsx` | About, Terms, Privacy pages |
| `src/services/api.js` | **CRITICAL** — Backend se baat karta hai (fetch calls) |
| `src/context/` | React Context — Theme, Auth state globally |
| `src/components/` | Reusable UI components (AstraLogo, etc.) |
| `src/translations.js` | Multi-language support (EN + other langs) |
| `.env` | Frontend environment variables (VITE_*) |
| `vite.config.js` | Build config |
| `netlify.toml` (root) | Netlify deployment config |

**Frontend ka DATABASE connection:** ❌ NAHI — Frontend directly database se baat NAHI karta.  
Frontend → API calls → Backend → Database (always this flow)

---

### ⚙️ BACKEND (`backend/`)

**Kya hai:** FastAPI (Python) server — business logic, AI calls, database queries.

> ⚠️ **IMPORTANT:** Tumhare paas 2 alag backend implementations hain!

| File | Kya hai | Status |
|---|---|---|
| `server.py` | **OLD backend** — Pure Python (no frameworks), SQLite only, 1733 lines | Legacy |
| `app/main.py` | **NEW backend** — FastAPI, proper structure, PostgreSQL support | Use this |

**`app/` folder (NEW — ye use karo):**

| File | Kya karta hai |
|---|---|
| `app/main.py` | FastAPI app entry point, CORS setup, router include |
| `app/config.py` | Environment variables read karta hai (`.env` file se) |
| `app/database.py` | Database connection (PostgreSQL ya SQLite fallback) |
| `app/models.py` | Database tables define karta hai (User, Chat, Message, etc.) |
| `app/schemas.py` | Request/Response data shapes (Pydantic) |
| `app/auth.py` | JWT token logic |
| `app/routers/auth.py` | `/auth/*` API endpoints (login, register, OTP) |
| `app/routers/chat.py` | `/chat/*` API endpoints |
| `app/routers/user.py` | `/user/*` API endpoints |
| `app/routers/admin.py` | `/admin/*` API endpoints |
| `app/routers/ai.py` | `/ai/*` endpoints (AI model calls) |
| `app/services/ai_service.py` | Gemini/OpenAI API integration logic |
| `app/services/pdf_service.py` | PDF upload/parse logic |
| `.env` | Backend secrets (DB URL, API keys, SMTP) |
| `requirements.txt` | Python dependencies |
| `Dockerfile` | Docker image for Render deployment |

**Backend ka DATABASE connection:**
- `app/config.py` → `DATABASE_URL` env variable se URL uthata hai
- `app/database.py` → SQLAlchemy engine banata hai
- Default: PostgreSQL → Fallback: SQLite (local file `astra_ai_local.db`)

---

### 🗄️ DATABASE Tables

`app/models.py` me ye tables hain:

| Table | Kya store hota hai |
|---|---|
| `users` | User accounts, subscription tier, admin flag |
| `projects` | User ke projects/folders |
| `chat_sessions` | Individual chat conversations |
| `messages` | Har message (user + AI responses) |
| `api_keys` | User-generated API keys |
| `usage_stats` | Token usage tracking |
| `otp_verifications` | Email OTP codes (temporary) |

---

## 🌐 PART 2: Netlify + Render + Supabase Deployment

### Architecture Overview

```
USER (Browser)
    ↓
[NETLIFY] — Frontend (React build)
    ↓ API calls
[RENDER] — Backend (FastAPI Python)
    ↓ DB queries
[SUPABASE] — PostgreSQL Database
```

**Ye teeno ALAG alag services hain — ek dusre se independently deploy hote hain!**

---

### 🟦 SUPABASE (Database) — Pehle Setup Karo

1. supabase.com → New Project banao
2. **Settings → Database → Connection String** copy karo
   - Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`
3. Ye URL tumhara `DATABASE_URL` hai

---

### 🟩 RENDER (Backend) — Dusra Setup Karo

**Kaise connect karo:**
1. render.com → New Web Service
2. GitHub repo connect karo
3. **Root Directory:** `backend`
4. **Build Command:** `pip install -r requirements.txt`
5. **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**Environment Variables Render pe add karo:**
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@[SUPABASE_HOST]:5432/postgres
SECRET_KEY=apna_koi_strong_random_key
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
GOOGLE_CLIENT_ID=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASSWORD=your_app_password
```

**Backend URL milegi:** `https://astra-ai-backend.onrender.com` (ya jo bhi naam doge)

> ⚠️ **IMPORTANT — CORS Fix Karo!**  
> `backend/app/main.py` me apna Netlify URL add karo:

```python
origins = [
    "http://localhost:5173",
    "https://your-app.netlify.app",  # ← YE ADD KARO
    "https://yourdomain.com",         # ← custom domain ho to
]
```

---

### 🟥 NETLIFY (Frontend) — Teesra Setup Karo

1. netlify.com → New Site → GitHub repo connect karo
2. **Base directory:** `frontend`
3. **Build command:** `npm run build`
4. **Publish directory:** `frontend/dist`
   - (netlify.toml already ye settings karta hai automatically ✅)

**Environment Variables Netlify pe add karo:**
```
VITE_API_URL=https://astra-ai-backend.onrender.com
VITE_GOOGLE_CLIENT_ID=994233493259-...googleusercontent.com
```

**Frontend URL milegi:** `https://astra-ai.netlify.app`

---

## 🔄 PART 3: Future Updates — Kya Karna Padega?

### Rule: Sirf jo change kiya, wahi redeploy karo!

| Tumne kya change kiya | Kya redeploy karna hai |
|---|---|
| Frontend code (JSX, CSS, pages) | ✅ Netlify only |
| Backend code (Python, routes, AI) | ✅ Render only |
| Database schema (new table/column) | ✅ Supabase + Render restart |
| Both frontend + backend | ✅ Netlify + Render |
| Sirf env variable change | ✅ Wahi service jahan change kiya |

### GitHub se Auto-Deploy (Recommended!)

**Ye setup karo ek baar — phir automatic hoga:**

1. **Netlify** → Site Settings → Build & Deploy → **auto-deploy from `main` branch** enable karo
2. **Render** → Service Settings → **Auto-Deploy: Yes**

**Phir workflow:**
```
Code change karo locally
    ↓
git add . && git commit -m "fix: backend chat bug"
    ↓
git push origin main
    ↓
Render automatically detects → backend rebuild + redeploy ✅
Netlify automatically detects → frontend rebuild + redeploy ✅
```

**Sirf backend change kiya?**
```
git push → Render deploys backend automatically
Netlify bhi trigger hoga BUT frontend same rahega (no visible change)
```

Agar sirf backend kaam kar rahe ho aur Netlify waste trigger se bachna ho:
- Render manual deploy bhi kar sakte ho: Dashboard → Manual Deploy → Deploy Latest

---

## ❄️ PART 4: Render Cold Start Problem — Fix

### Problem Kya Hai?
Render **free tier** pe server **15 minutes inactivity ke baad "sleep"** ho jaata hai.  
Jab pehli request aati hai to server **30-60 seconds** lagta hai wake up hone me — frontend "loading" dikhta rehta hai.

### Solutions:

#### Option A — Keep-Alive Ping (Free, Easy) ⭐ Recommended
Ek free service se har 14 minutes me apne backend ko ping karo:

**[UptimeRobot](https://uptimerobot.com) use karo:**
1. Free account banao
2. New Monitor → HTTP(s) type
3. URL: `https://astra-ai-backend.onrender.com/`
4. Interval: **14 minutes**
5. ✅ Server kabhi sleep nahi karega!

#### Option B — Frontend Loading Screen
Agar server cold start hota hai to user ko nice loading UI dikhao:

Tumhara `frontend/src/services/api.js` me ye add karo:

```js
// Render cold start warmup
export async function warmupBackend() {
  try {
    await fetch(`${API_BASE_URL}/`, { method: 'GET' });
  } catch (e) {
    // silent fail
  }
}
```

Phir `App.jsx` me app load hote hi call karo — server warm ho jaayega background me.

#### Option C — Render Paid Plan ($7/month)
Render ke **Starter plan** pe server kabhi sleep nahi karta. Agar production app hai to ye best hai.

---

## 🐛 PART 5: Existing Issues Jo Fix Karne Chahiye

### 1. Duplicate Backend Problem ⚠️
Tumhare paas **2 alag backends** hain ek hi project me:
- `backend/server.py` (1733 lines, old, SQLite-only, raw Python HTTP server)
- `backend/app/` (FastAPI, proper structure, PostgreSQL ready)

**Yahi confusion ka root cause hai!**  
Currently `python server.py` chala rahe ho jo OLD backend hai.

**Fix:** `app/` wala use karo. Deployment me:
```
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Locally:
```bash
cd backend
uvicorn app.main:app --reload
```

### 2. CORS Missing Netlify URL
`backend/app/main.py` line 37 pe sirf `https://astra.ai` hai.  
Netlify URL add nahi hai — isse frontend-backend communication fail hogi!

**Fix:** Netlify URL pata lagao, phir add karo (upar bataya hai).

### 3. Frontend `.env` me VITE_API_URL missing
`frontend/.env` me abhi sirf Google Client ID hai:
```
VITE_GOOGLE_CLIENT_ID=994233493259-...
```

`VITE_API_URL` missing hai — to frontend default `http://localhost:8000` use karega.  
Production me ye explicitly set karna ZAROORI hai Netlify pe.

### 4. psycopg2 Missing in requirements.txt
PostgreSQL use karne ke liye `psycopg2-binary` package chahiye jo `requirements.txt` me nahi hai!

**Fix:**
```
fastapi==0.110.0
uvicorn==0.28.0
pydantic==2.6.4
pydantic-settings==2.2.1
sqlalchemy==2.0.28
psycopg2-binary==2.9.9   ← YE ADD KARO
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
python-dotenv==1.0.1
httpx==0.27.0
jinja2==3.1.3
```

---

## ✅ Quick Action Checklist (Deployment Steps)

- [ ] `requirements.txt` me `psycopg2-binary` add karo
- [ ] `backend/app/main.py` me Netlify URL CORS me add karo
- [ ] Supabase project banao → DATABASE_URL lo
- [ ] Render pe backend deploy karo → saari env vars set karo
- [ ] Netlify pe frontend deploy karo → `VITE_API_URL` set karo
- [ ] UptimeRobot se Render backend ping setup karo (cold start fix)
- [ ] Auto-deploy GitHub se enable karo dono me
- [ ] `server.py` ko README me note karo ki ye legacy hai (confuse mat ho)
