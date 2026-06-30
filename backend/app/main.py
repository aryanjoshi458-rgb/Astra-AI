import logging
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import auth, chat, user, admin, ai

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("astra_ai.main")

# Auto-create database tables on startup.
# In a real environment, we'd use Alembic migrations, but this ensures a zero-setup out-of-the-box run.
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
except Exception as e:
    logger.error(f"Error initializing database tables: {e}")

app = FastAPI(
    title="Astra AI API Platform",
    description="Think Beyond Limits - Modern Full-Stack AI Platform Backend",
    version="1.0.0"
)

# CORS Configuration
# Standard React Vite local dev server runs on http://localhost:5173 or http://localhost:5174
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "https://astra.ai",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(user.router)
app.include_router(admin.router)
app.include_router(ai.router)

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "platform": "Astra AI API Gateway",
        "tagline": "Think Beyond Limits",
        "docs_url": "/docs"
    }

# Startup and shutdown logs
@app.on_event("startup")
def startup_event():
    logger.info("Astra AI Backend Application starting up...")

@app.on_event("shutdown")
def shutdown_event():
    logger.info("Astra AI Backend Application shutting down...")
