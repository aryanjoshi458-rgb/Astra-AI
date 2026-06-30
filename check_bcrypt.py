import bcrypt
print("Bcrypt version:", bcrypt.__version__)
try:
    print("Bcrypt __about__:", bcrypt.__about__)
except Exception as e:
    print("Bcrypt __about__ error:", e)

from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
try:
    h = pwd_context.hash("AdminAstra2026!")
    print("Hashed successfully:", h)
except Exception as e:
    print("Hash error:", e)
