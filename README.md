# Astra AI - Think Beyond Limits

Astra AI is a complete, production-ready full-stack AI Assistant platform inspired by ChatGPT, Gemini, and Claude. It features a premium dark-glassmorphic UI, robust JWT + OTP authentication, visual document processing (PDF context scraping), secure API key generation, user dashboard metrics, and a dedicated admin telemetry control panel.

---

## 🛠️ Technology Stack

- **Frontend**: React.js (Vite), Tailwind CSS, Lucide Icons, Web Speech API (speechSynthesis).
- **Backend**: Python 3.10+, FastAPI, SQLAlchemy, Uvicorn, ReportLab (PDF Export).
- **Database**: PostgreSQL (with dynamic SQLite fallback).
- **Docker**: Orchestrated containers for DB, API, and Web Client.

---

## 📂 Project Structure

```
Astra-AI/
├── backend/
│   ├── app/
│   │   ├── config.py           # Settings loader & environment variables
│   │   ├── database.py         # SQLAlchemy engine connection
│   │   ├── models.py           # Database entities (User, Session, Key)
│   │   ├── schemas.py          # Pydantic schemas (Request & Response)
│   │   ├── auth.py             # JWT signature, verification & hashes
│   │   ├── routers/            # Controllers: auth, chat, user, admin, ai
│   │   └── services/           # Services: ai_service, pdf_service
│   ├── init_db.py              # Seeding database with mock admins/chats
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/         # Markdown code block parses
│   │   ├── context/            # AuthContext, ThemeContext, ChatContext
│   │   ├── pages/              # Landing, Auth, Dashboard, Profiles, Admin, Statics
│   │   ├── services/           # Api client wrappers
│   │   ├── App.jsx             # State based router & AuthGuard
│   │   └── index.css           # Custom glassmorphism class tokens
│   ├── index.html
│   ├── Dockerfile
│   └── tailwind.config.js
├── docker-compose.yml
├── init-db.sql
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Python** (version 3.10 or higher) OR **Docker & Docker Compose**
- **Node.js** (version 18 or higher) & **npm**

---

### Method 1: Local Development Run (Zero Setup SQLite Fallback)

If you don't have PostgreSQL installed, Astra AI **automatically falls back to a local SQLite database** out of the box!

#### Step 1: Start the Backend
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create virtual environment and install packages:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate

   pip install -r requirements.txt
   ```
3. Initialize the database and seed default accounts:
   ```bash
   python init_db.py
   ```
4. Start the FastAPI API server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *The API will be available at `http://localhost:8000`. API docs at `/docs`.*

#### Step 2: Start the Frontend
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *The web client will load at `http://localhost:5173`.*

---

### Method 2: Docker Containers (Full Production Stack)

To run the complete production setup with PostgreSQL:
1. Ensure Docker is running.
2. In the project root, run:
   ```bash
   docker-compose up --build
   ```
3. The services will map to:
   - **Frontend**: `http://localhost:5173` (or `http://localhost:80` inside container)
   - **Backend API**: `http://localhost:8000`
   - **PostgreSQL**: Port `5432`

---

## 🔑 Seeding / Testing Credentials

When you run `init_db.py` (automatically done inside Docker, or manually executed locally), it seeds a default Admin profile for testing convenience:

- **Username**: `admin@astra.ai`
- **Password**: `AdminAstra2026!`

*Note: Since the backend logs verification codes to the terminal console during OTP login requests, you can enter any email (e.g. `test@user.com`) and retrieve the 6-digit key from your backend command line terminal.*

---

## 🛡️ Security Features

1. **Password Hashing**: Standard `passlib` with `bcrypt` schemas.
2. **Bearer JWT Validation**: Handled on every query with strict role evaluations.
3. **API Key Hashing**: Key keys are hashed using SHA-256 before write to Postgres, preventing breaches.
4. **CORS Restrictions**: Explicit origin bounds prevent unsolicited scripts from loading resources.
