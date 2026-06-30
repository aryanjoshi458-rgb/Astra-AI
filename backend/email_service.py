"""
email_service.py — SMTP Email Service for Astra AI Backend

Handles:
  - OTP verification emails
  - SMTP configuration loading from environment variables
  - Supports Gmail (port 587 TLS) and SSL (port 465) mail servers

Environment Variables Required (.env):
  SMTP_HOST     — e.g. smtp.gmail.com
  SMTP_PORT     — 587 (TLS) or 465 (SSL), default: 587
  SMTP_USER     — Your sender email address
  SMTP_PASSWORD — App password (not your actual Gmail password!)
  OTP_EXPIRY_MINUTES — OTP validity window (default: 5 minutes)
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def send_otp_email(email_to: str, otp: str) -> bool:
    """
    Send a 6-digit OTP verification code to the specified email address.

    Args:
        email_to: Recipient email address
        otp: The 6-digit OTP code string

    Returns:
        True if email was sent successfully, False otherwise
    """
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT", "587")
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")

    if not smtp_host or not smtp_user or not smtp_password:
        print(
            f"[Email Config] SMTP settings missing. OTP not sent to {email_to}.",
            flush=True,
        )
        return False

    try:
        msg = MIMEMultipart()
        msg["From"] = f"Astra AI <{smtp_user}>"
        msg["To"] = email_to
        msg["Subject"] = f"{otp} is your Astra AI verification code"

        body = f"""Hello,

Your Astra AI verification code is: {otp}

This code is valid for 5 minutes. Please do not share this code with anyone.

Best regards,
Astra AI Team"""

        msg.attach(MIMEText(body, "plain"))

        port = int(smtp_port)
        if port == 465:
            # SSL connection
            server = smtplib.SMTP_SSL(smtp_host, port, timeout=10)
        else:
            # TLS connection (default for Gmail port 587)
            server = smtplib.SMTP(smtp_host, port, timeout=10)
            server.starttls()

        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_user, email_to, msg.as_string())
        server.quit()

        print(f"[Email Sent] Successfully sent OTP to {email_to}", flush=True)
        return True

    except Exception as e:
        print(f"[Email Error] Failed to send email to {email_to}: {e}", flush=True)
        return False


def send_welcome_email(email_to: str, full_name: str) -> bool:
    """
    Send a welcome email to a newly registered user.

    Args:
        email_to: Recipient email address
        full_name: User's display name

    Returns:
        True if email was sent successfully, False otherwise
    """
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT", "587")
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")

    if not smtp_host or not smtp_user or not smtp_password:
        return False

    try:
        msg = MIMEMultipart()
        msg["From"] = f"Astra AI <{smtp_user}>"
        msg["To"] = email_to
        msg["Subject"] = "Welcome to Astra AI 🚀"

        body = f"""Hello {full_name},

Welcome to Astra AI! Your account has been created successfully.

You can now log in and start exploring AI-powered features:
  • Chat with powerful AI models (Groq Llama, Gemma, Mixtral)
  • Generate images with /image or /draw commands
  • Upload PDFs and images for AI analysis
  • Manage your API keys from the Profile page

Get started: https://astra-ai.netlify.app

Best regards,
The Astra AI Team"""

        msg.attach(MIMEText(body, "plain"))

        port = int(smtp_port)
        if port == 465:
            server = smtplib.SMTP_SSL(smtp_host, port, timeout=10)
        else:
            server = smtplib.SMTP(smtp_host, port, timeout=10)
            server.starttls()

        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_user, email_to, msg.as_string())
        server.quit()

        print(f"[Email Sent] Welcome email sent to {email_to}", flush=True)
        return True

    except Exception as e:
        print(f"[Email Error] Failed to send welcome email to {email_to}: {e}", flush=True)
        return False
