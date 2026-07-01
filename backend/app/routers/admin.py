from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas, auth
from app.database import get_db

router = APIRouter(prefix="/api/admin", tags=["Admin Control Panel"])

@router.get("/stats", response_model=schemas.AdminDashboardStats)
def get_admin_stats(
    current_admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(models.User).count()
    total_chats = db.query(models.ChatSession).count()
    total_messages = db.query(models.Message).count()
    premium_users = db.query(models.User).filter(models.User.subscription_tier != "free").count()
    active_keys = db.query(models.APIKey).filter(models.APIKey.is_active == True).count()
    
    # Calculate sum of tokens
    from sqlalchemy import func
    tokens_sum = db.query(func.sum(models.UsageStats.tokens_used)).scalar() or 0
    requests_sum = db.query(func.sum(models.UsageStats.requests_count)).scalar() or 0

    return {
        "total_users": total_users,
        "total_chats": total_chats,
        "total_messages": total_messages,
        "premium_users": premium_users,
        "active_keys": active_keys,
        "monthly_requests": requests_sum
    }

@router.get("/users", response_model=List[schemas.UserResponse])
def get_all_users(
    current_admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    users = db.query(models.User).order_by(models.User.created_at.desc()).all()
    return users

@router.put("/users/{user_id}/subscription", response_model=schemas.UserResponse)
def update_user_subscription(
    user_id: int,
    payload: schemas.SubscriptionUpdate,
    current_admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.subscription_tier = payload.tier.lower()
    
    # Set custom API key limits based on tier
    if user.subscription_tier == "free":
        user.api_key_limit = 5
    elif user.subscription_tier == "premium":
        user.api_key_limit = 20
    elif user.subscription_tier == "enterprise":
        user.api_key_limit = 100
        
    db.commit()
    db.refresh(user)
    return user

@router.put("/users/{user_id}/toggle-status", response_model=schemas.UserResponse)
def toggle_user_active_status(
    user_id: int,
    current_admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Admins cannot deactivate themselves")
        
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user

@router.get("/monitoring/chats")
def monitor_recent_chats(
    current_admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    # Fetch 50 most recent chats along with user email and message count
    recent_chats = db.query(models.ChatSession)\
        .join(models.User)\
        .order_by(models.ChatSession.updated_at.desc())\
        .limit(50)\
        .all()
        
    chats_data = []
    for s in recent_chats:
        msg_count = db.query(models.Message).filter(models.Message.session_id == s.id).count()
        chats_data.append({
            "id": s.id,
            "title": s.title,
            "user_email": s.user.email,
            "user_id": s.user_id,
            "message_count": msg_count,
            "updated_at": s.updated_at
        })
    return chats_data

from pydantic import BaseModel
class PlanConfigItem(BaseModel):
    tier: str
    display_name: str
    base_price_usd: float
    gst_rate: float

class PricingUpdatePayload(BaseModel):
    plans: List[PlanConfigItem]

@router.get("/pricing")
def get_pricing_config(
    current_admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    plans = db.query(models.PlanConfig).order_by(models.PlanConfig.id).all()
    if not plans:
        # Seed default plan configs if empty
        default_plans = [
            models.PlanConfig(tier="free", display_name="Free", base_price_usd=0.0, gst_rate=18.0),
            models.PlanConfig(tier="premium", display_name="Premium", base_price_usd=2.0, gst_rate=18.0),
            models.PlanConfig(tier="enterprise", display_name="Enterprise", base_price_usd=4.0, gst_rate=18.0)
        ]
        for p in default_plans:
            db.add(p)
        db.commit()
        plans = db.query(models.PlanConfig).order_by(models.PlanConfig.id).all()
    return plans

@router.put("/pricing")
def update_pricing_config(
    payload: PricingUpdatePayload,
    current_admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    now = datetime.datetime.utcnow()
    for p in payload.plans:
        plan = db.query(models.PlanConfig).filter(models.PlanConfig.tier == p.tier).first()
        if plan:
            plan.display_name = p.display_name
            plan.base_price_usd = p.base_price_usd
            plan.gst_rate = p.gst_rate
            plan.updated_at = now
    db.commit()
    return db.query(models.PlanConfig).order_by(models.PlanConfig.id).all()
