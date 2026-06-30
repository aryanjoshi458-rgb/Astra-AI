import datetime
from app.database import engine, Base, SessionLocal
from app import models, auth

def init_database():
    print("Initialising database tables...")
    
    db = SessionLocal()
    try:
        Base.metadata.create_all(bind=engine)
        # Check if an admin user already exists
        admin_email = "admin@astra.ai"
        admin_user = db.query(models.User).filter(models.User.email == admin_email).first()
        
        if not admin_user:
            print(f"Seeding default admin user: {admin_email}")
            hashed_pwd = auth.get_password_hash("AdminAstra2026!")
            
            admin_user = models.User(
                email=admin_email,
                hashed_password=hashed_pwd,
                full_name="Astra Admin",
                is_admin=True,
                subscription_tier="enterprise",
                avatar_url=""
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            
            # Add initial usage stats
            initial_stats = models.UsageStats(
                user_id=admin_user.id,
                tokens_used=12500,
                requests_count=52
            )
            db.add(initial_stats)
            
            # Seed a default chat session
            chat = models.ChatSession(
                user_id=admin_user.id,
                title="Welcome to Astra AI Dashboard"
            )
            db.add(chat)
            db.commit()
            db.refresh(chat)
            
            # Seed default messages
            user_msg = models.Message(
                session_id=chat.id,
                sender="user",
                content="Help me get started with Astra AI. What can I do?"
            )
            assistant_msg = models.Message(
                session_id=chat.id,
                sender="assistant",
                content=(
                    "Welcome, Astra Admin! As an enterprise-tier user, you can:\n\n"
                    "1. **Engage in Advanced Conversations**: Use our fast real-time chat interface.\n"
                    "2. **Analyze PDFs & Documents**: Simply drag and drop PDFs into the attachment field.\n"
                    "3. **Analyze Images**: Use our mock image-ocr analyzer to read designs and photos.\n"
                    "4. **Manage API Keys**: Create and revoke secure API keys directly in the Profile settings.\n"
                    "5. **Monitor System Analytics**: Access the Admin panel from the top right to track users, tokens, and billing statistics.\n\n"
                    "Let me know what we are building today!"
                ),
                model_used="astra-gpt-4"
            )
            db.add(user_msg)
            db.add(assistant_msg)
            
            db.commit()
            print("Database seeding completed successfully.")
        else:
            print("Database already contains seeded data.")
            
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
