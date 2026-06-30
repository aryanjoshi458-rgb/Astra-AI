import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

logger = logging.getLogger("astra_ai.database")

database_url = settings.DATABASE_URL

if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

# Fallback to SQLite if PostgreSQL fails to connect, to ensure smooth local testing.
if not database_url.startswith("postgresql://") and not database_url.startswith("sqlite://"):
    # If the user didn't change it or specified a wrong format, default to SQLite local file
    database_url = "sqlite:///./astra_ai_local.db"
    logger.warning("DATABASE_URL does not match standard PostgreSQL format. Falling back to SQLite local database.")

connect_args = {}
if database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(database_url, connect_args=connect_args)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    logger.error(f"Failed to initialize database engine with URL {database_url}: {e}")
    # Hard fallback to SQLite
    fallback_url = "sqlite:///./astra_ai_fallback.db"
    logger.warning(f"Attempting fallback to local SQLite database: {fallback_url}")
    engine = create_engine(fallback_url, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
