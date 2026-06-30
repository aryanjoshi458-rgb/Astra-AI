"""
google_auth_service.py — Google OAuth Token Verification Service

Handles:
  - Google ID Token verification (JWT format, from Google Sign-In button)
  - Google Access Token verification (from @react-oauth/google useGoogleLogin hook)

The frontend sends whichever token it receives from Google.
This module tries both verification methods gracefully.

Environment Variables:
  GOOGLE_CLIENT_ID — Your Google OAuth 2.0 Client ID
                     (from https://console.cloud.google.com)
"""

import os
import json
import urllib.request


def verify_google_token(credential: str) -> dict | None:
    """
    Verify a Google credential token and extract user info.

    Tries ID Token (JWT) verification first, then falls back to
    Access Token userinfo endpoint verification.

    Args:
        credential: Google ID token (JWT) or Access token string

    Returns:
        Dict with keys: email, name, picture
        Returns None if verification fails for both methods
    """
    google_client_id = os.getenv("GOOGLE_CLIENT_ID")

    # ── Method 1: JWT ID Token verification ──────────────────────────────────
    # The credential is a JWT if it contains exactly two dots
    if credential.count(".") == 2:
        email, name, picture = _verify_id_token(credential, google_client_id)
        if email:
            return {"email": email, "name": name, "picture": picture}

    # ── Method 2: Access Token → userinfo endpoint ────────────────────────────
    email, name, picture = _verify_access_token(credential)
    if email:
        return {"email": email, "name": name, "picture": picture}

    return None


def _verify_id_token(credential: str, client_id: str | None):
    """
    Verify a Google JWT ID Token using the google-auth library.

    Returns:
        Tuple (email, name, picture) on success, or ("", "", "") on failure
    """
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests

        idinfo = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            client_id,  # Pass None to skip audience check (dev mode)
        )
        email = idinfo.get("email", "")
        name = idinfo.get("name", email.split("@")[0] if email else "")
        picture = idinfo.get("picture", "")
        print(f"[Google Auth] ID Token verified for: {email}", flush=True)
        return email, name, picture

    except ImportError:
        print(
            "[Google Auth] 'google-auth' package not installed. "
            "Run: pip install google-auth",
            flush=True,
        )
    except Exception as e:
        print(f"[Google Auth] ID Token verification failed: {e}", flush=True)

    return "", "", ""


def _verify_access_token(credential: str):
    """
    Verify a Google Access Token by calling the userinfo endpoint.

    Returns:
        Tuple (email, name, picture) on success, or ("", "", "") on failure
    """
    try:
        url = "https://www.googleapis.com/oauth2/v3/userinfo"
        req = urllib.request.Request(
            url,
            headers={"Authorization": f"Bearer {credential}"},
        )
        with urllib.request.urlopen(req, timeout=5.0) as response:
            idinfo = json.loads(response.read().decode("utf-8"))

        email = idinfo.get("email", "")
        name = idinfo.get("name", email.split("@")[0] if email else "")
        picture = idinfo.get("picture", "")
        print(f"[Google Auth] Access Token verified for: {email}", flush=True)
        return email, name, picture

    except Exception as e:
        print(f"[Google Auth] Access Token verification failed: {e}", flush=True)

    return "", "", ""
