from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
import datetime

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None


# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOTPRequest(BaseModel):
    email: EmailStr

class UserOTPVerify(BaseModel):
    email: EmailStr
    otp_code: str

class GoogleLoginRequest(BaseModel):
    credential: str # Google ID token

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class UserResponse(UserBase):
    id: int
    avatar_url: Optional[str] = None
    is_active: bool
    is_admin: bool
    subscription_tier: str
    api_key_limit: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# --- API Key Schemas ---
class APIKeyCreate(BaseModel):
    name: str
    custom_key: Optional[str] = None

class APIKeyResponse(BaseModel):
    id: int
    name: str
    created_at: datetime.datetime
    is_active: bool
    # We only show the full key upon creation; after that we hash it.
    raw_key: Optional[str] = None

    class Config:
        from_attributes = True


# --- Message Schemas ---
class MessageCreate(BaseModel):
    content: str
    file_url: Optional[str] = None
    file_type: Optional[str] = None
    model_used: Optional[str] = "astra-gpt-4"

class MessageResponse(BaseModel):
    id: int
    session_id: int
    sender: str # 'user' or 'assistant'
    content: str
    model_used: Optional[str] = None
    file_url: Optional[str] = None
    file_type: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# --- Chat Session Schemas ---
class ChatSessionCreate(BaseModel):
    title: Optional[str] = "New Chat"

class ChatRenameRequest(BaseModel):
    title: str

class ChatSessionResponse(BaseModel):
    id: int
    user_id: int
    title: str
    is_pinned: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class ChatSessionDetailResponse(ChatSessionResponse):
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True


# --- Usage Stats & Admin Schemas ---
class UsageStatsResponse(BaseModel):
    id: int
    user_id: int
    tokens_used: int
    requests_count: int
    date: datetime.datetime

    class Config:
        from_attributes = True

class AdminDashboardStats(BaseModel):
    total_users: int
    total_chats: int
    total_messages: int
    premium_users: int
    active_keys: int
    monthly_requests: int

class SubscriptionUpdate(BaseModel):
    tier: str # free, premium, enterprise
