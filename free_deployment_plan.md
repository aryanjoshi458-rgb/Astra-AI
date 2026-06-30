# Netlify + Render + Supabase Deployment Guide (Hinglish)

Astra-AI site ko Netlify (Frontend), Render (Backend), aur Supabase (Database) par step-by-step deploy karne ki guide:

---

## 💾 Step 1: Database Setup (Supabase - FREE)
Render ke free servers stateless hote hain, isliye SQL Database cloud par deploy karna padega. Supabase bilkul free dynamic PostgreSQL Database deta hai.

1. **Supabase signup karein**:
   - [Supabase.com](https://supabase.com/) par jayein aur GitHub/Google account se Sign Up karein.
2. **Project Create karein**:
   - Dashboard me **New Project** click karein.
   - Project Name dalein (jaise: `Astra-AI-DB`).
   - Secure Database Password select karein (aur use save kar lein).
   - Region (जैसे: Singapore or Mumbai) select karein aur click **Create New Project**.
3. **Database URL copy karein**:
   - Project ban jaane ke baad, dashboard ke Sidebar me **Project Settings** (gear icon) -> **Database** par jayein.
   - **Connection string** section me **URI** option par click karein.
   - Connection URL copy karein, jo is tarah hoga:
     `postgresql://postgres.[username]:[password]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`
   - **Note**: `[password]` ki jagah wo password likhein jo aapne Step 2 me set kiya tha.

---

## 🐍 Step 2: Backend Deployment (Render - FREE)
Render server sleep mode me chala jata hai agar use 15 mins traffic na mile (jisse reload hone me 50 seconds lagte hain). Hum is speed issue ko next step me solve karenge.

1. **Code GitHub par push karein**:
   - Apne workspace code ko GitHub repository me commit aur push karein.
2. **Render connect karein**:
   - [Render.com](https://render.com/) dashboard open karein.
   - **New +** click karein aur **Web Service** choose karein.
   - Apne GitHub repository ko connect karein.
3. **Configuration Settings**:
   - **Name**: `astra-ai-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
4. **Environment Variables set karein**:
   - Screen ke bottom me **Advanced** click karke variables add karein:
     - `DATABASE_URL` = (Supabase se copy kiya hua connection URI URL password ke sath)
     - `GEMINI_API_KEY` = (Aapka API Key)
     - `SECRET_KEY` = `some-long-random-secret-key-12345`
     - `ALGORITHM` = `HS256`
5. **Deploy**:
   - Service start hone ke baad aapko backend web URL milega (jaise `https://astra-ai-backend.onrender.com`). Is URL ko note kar lein.

---

## ⚡ Step 3: Render Slow Startup (Cold Start) Bypass Trick
Render free service 15 min inactive hone par automatic band ho jati hai. Ise **24/7 online** rakhne ka free solution:

1. **UptimeRobot register karein**:
   - [UptimeRobot.com](https://uptimerobot.com/) par ek free account banayein.
2. **Add New Monitor**:
   - Dashboard me **Add New Monitor** click karein.
   - **Monitor Type**: `HTTPS`
   - **Friendly Name**: `Astra Backend Ping`
   - **URL (or IP)**: Apne Render Backend ka URL dalein (jaise: `https://astra-ai-backend.onrender.com/` - iske aage slash add karein).
   - **Monitoring Interval**: `5 minutes` (Free tier support).
3. **Save**:
   - Monitor setup hone ke baad, UptimeRobot har 5 minute me backend ko request bhejega. Is wajah se Render backend kabhi sleep mode me nahi jayega aur 24/7 instant response dega!

---

## ⚛️ Step 4: Frontend Deployment (Netlify - FREE)
Humne project root folder me `netlify.toml` already generate kiya hua hai, isliye iski deployment bahut simple hai.

1. **Netlify signup & connect**:
   - [Netlify.com](https://www.netlify.com/) par Google/GitHub account ke saath signup karein.
   - **Add new site** -> **Import from Git** choose karein.
   - GitHub connect karke `Astra-AI` repository select karein.
2. **Build Settings**:
   - Netlify automatic file setup check kar lega. Settings crosscheck karein:
     - **Base directory**: `frontend`
     - **Build command**: `npm run build`
     - **Publish directory**: `frontend/dist` (netlify.toml settings apply ho jayengi).
3. **Environment Variables**:
   - Dashboard settings me **Site configuration** -> **Environment variables** me jayein:
     - `VITE_API_URL` = (Aapka live Render Backend URL, jaise: `https://astra-ai-backend.onrender.com`)
4. **Deploy Site**:
   - Click deploy. Netlify site build karke aapko unique static live website domain provide kar dega (jaise `https://astra-ai.netlify.app`).

---

## 🔍 Step 5: Site Google Search me Lana (SEO Indexing)

1. **Sitemap & Robots configure karein**:
   - Apni live netlify url ko check karke domain name ko update karein.
2. **Google Search Console verify karein**:
   - [Google Search Console](https://search.google.com/search-console/) me apna live netlify URL dalein (`https://yourname.netlify.app`).
   - HTML meta verification tag copy karein aur use frontend ke `index.html` main body template layout tag head ke niche copy paste karke redeploy karein.
   - Click **Verify** on Google Search Console.
   - Verification complete hone par indexing start ho jayegi!
