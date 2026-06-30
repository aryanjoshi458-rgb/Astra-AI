import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/astra_ai"
    SECRET_KEY: str = "supersecretjwttokenkeyforastraai2026productionreadyjwt"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # AI API Keys
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    
    # Social OAuth
    GOOGLE_CLIENT_ID: str = ""
    
    # SMTP / OTP Configuration
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    OTP_EXPIRY_MINUTES: int = 5

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
