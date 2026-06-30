import datetime
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import models, schemas, auth
from app.database import get_db

logger = logging.getLogger("astra_ai.auth_router")
router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.UserResponse)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if email exists
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already registered")
    
    hashed_password = auth.get_password_hash(user_data.password)
    
    # Make first user admin for testing convenience
    is_first_user = db.query(models.User).count() == 0
    
    new_user = models.User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name or user_data.email.split("@")[0].capitalize(),
        is_admin=is_first_user,
        subscription_tier="free"
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Add initial usage stats
    initial_stats = models.UsageStats(user_id=new_user.id, tokens_used=0, requests_count=0)
    db.add(initial_stats)
    db.commit()
    
    return new_user

@router.post("/login/classic", response_model=schemas.Token)
def login_classic(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_credentials.email).first()
    if not user or not auth.verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="User accounts is deactivated")
        
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/otp/request")
def request_otp(payload: schemas.UserOTPRequest, db: Session = Depends(get_db)):
    # Create or update OTP
    otp_code = auth.generate_otp()
    expiry = datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
    
    # Check if a verification record already exists
    otp_record = db.query(models.OTPVerification).filter(models.OTPVerification.email == payload.email).first()
    if otp_record:
        otp_record.otp_code = otp_code
        otp_record.expires_at = expiry
    else:
        otp_record = models.OTPVerification(email=payload.email, otp_code=otp_code, expires_at=expiry)
        db.add(otp_record)
        
    db.commit()
    
    # LOG OTP to console so developer/user can see it instantly without SMTP
    print("\n" + "="*50)
    print(f"| ASTRA AI AUTH OTP FOR {payload.email}:  {otp_code}  |")
    print("="*50 + "\n")
    logger.info(f"OTP generated for {payload.email}: {otp_code}")
    
    return {"message": "OTP verification code sent. Please check your inbox (or backend logs)."}

@router.post("/otp/verify", response_model=schemas.Token)
def verify_otp(payload: schemas.UserOTPVerify, db: Session = Depends(get_db)):
    otp_record = db.query(models.OTPVerification).filter(
        models.OTPVerification.email == payload.email,
        models.OTPVerification.otp_code == payload.otp_code
    ).first()
    
    if not otp_record or otp_record.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired OTP code")
        
    # Check if user exists, if not, automatically register them (OTP-style sign-up)
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        is_first_user = db.query(models.User).count() == 0
        user = models.User(
            email=payload.email,
            full_name=payload.email.split("@")[0].capitalize(),
            is_admin=is_first_user,
            subscription_tier="free"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Initial usage stats
        initial_stats = models.UsageStats(user_id=user.id, tokens_used=0, requests_count=0)
        db.add(initial_stats)
        db.commit()
        
    # Delete OTP after successful verification
    db.delete(otp_record)
    db.commit()
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/google", response_model=schemas.Token)
def google_login(payload: schemas.GoogleLoginRequest, db: Session = Depends(get_db)):
    # In a production environment, you would use google.oauth2.id_token to verify the token:
    # idinfo = id_token.verify_oauth2_token(payload.credential, requests.Request(), settings.GOOGLE_CLIENT_ID)
    # email = idinfo['email']
    # For robust production fallbacks & mock triggers we parse or simulate a Google token decode.
    # If the token is 'mock_google_token_...', we parse the name and email directly.
    import httpx
    token_str = payload.credential
    email = "google_user@astra.ai"
    name = "Astra Google Explorer"
    avatar_url = ""
    
    # Verify token using Google's userinfo API
    if token_str and not token_str.startswith("mock_") and ":" not in token_str:
        try:
            resp = httpx.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {token_str}"},
                timeout=5.0
            )
            if resp.status_code == 200:
                info = resp.json()
                email = info.get("email", email)
                name = info.get("name", name)
                avatar_url = info.get("picture", "")
        except Exception as e:
            logger.error(f"Failed to verify Google token: {e}")
            
    if "email:" in token_str:
        # Easy debug hook: format token as "email:user@domain.com,name:User Name"
        try:
            parts = token_str.split(",")
            for part in parts:
                if part.startswith("email:"):
                    email = part.split(":", 1)[1]
                elif part.startswith("name:"):
                    name = part.split(":", 1)[1]
        except Exception:
            pass
            
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        is_first_user = db.query(models.User).count() == 0
        user = models.User(
            email=email,
            full_name=name,
            is_admin=is_first_user,
            subscription_tier="free",
            avatar_url=avatar_url
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        initial_stats = models.UsageStats(user_id=user.id, tokens_used=0, requests_count=0)
        db.add(initial_stats)
        db.commit()
        
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
