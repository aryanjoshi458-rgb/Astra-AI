import hashlib
import secrets
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import models, schemas, auth
from app.database import get_db

router = APIRouter(prefix="/api/user", tags=["User Profile & Settings"])

@router.get("/profile", response_model=schemas.UserResponse)
def get_profile(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@router.put("/profile", response_model=schemas.UserResponse)
def update_profile(
    payload: schemas.UserUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url
        
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/password")
def change_password(
    payload: schemas.PasswordChange,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Google users might not have a password set initially; they must use OTP/social unless set.
    if current_user.hashed_password:
        if not auth.verify_password(payload.old_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Incorrect old password")
            
    current_user.hashed_password = auth.get_password_hash(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully"}

# --- API Keys Management ---
@router.get("/keys", response_model=List[schemas.APIKeyResponse])
def get_api_keys(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    keys = db.query(models.APIKey).filter(models.APIKey.user_id == current_user.id).all()
    return keys

@router.post("/keys", response_model=schemas.APIKeyResponse)
def create_api_key(
    payload: schemas.APIKeyCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Verify key limits
    current_keys_count = db.query(models.APIKey).filter(models.APIKey.user_id == current_user.id).count()
    if current_keys_count >= current_user.api_key_limit:
        raise HTTPException(
            status_code=400,
            detail=f"You have reached your limit of {current_user.api_key_limit} API keys. Please upgrade or delete keys."
        )

    # Generate secure api key: either payload.custom_key or "astra_live_" + 32 random hex chars
    raw_key = payload.custom_key or f"astra_live_{secrets.token_hex(16)}"
    # SHA-256 hash the key for database storage
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()

    new_key = models.APIKey(
        user_id=current_user.id,
        key_hash=key_hash,
        name=payload.name
    )
    
    db.add(new_key)
    db.commit()
    db.refresh(new_key)
    
    # Temporarily append raw key to response schema so the user can copy it
    response_obj = schemas.APIKeyResponse.from_orm(new_key)
    response_obj.raw_key = raw_key
    return response_obj

@router.delete("/keys/{key_id}")
def revoke_api_key(
    key_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    key = db.query(models.APIKey).filter(
        models.APIKey.id == key_id, 
        models.APIKey.user_id == current_user.id
    ).first()
    
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
        
    db.delete(key)
    db.commit()
    return {"message": "API key revoked successfully"}

@router.delete("/account")
def delete_account(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    db.delete(current_user)
    db.commit()
    return {"message": "Account deleted successfully"}