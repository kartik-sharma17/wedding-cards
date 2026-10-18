"""Tiny signed, expiring tokens (standard library only).

Two kinds are used:
  typ="print"    : lets headless Chrome read ONE card's data for ~3 minutes (Chrome has no login)
  typ="download" : lets the browser download ONE cached PDF for ~2 minutes (a plain link can't send a login header)
"""

import base64
import hashlib
import hmac
import json
import os
import time
from config import settings

from fastapi import HTTPException

from v1.utility import ForbiddenError


def _secret() -> bytes:
    secret = settings.PDF_TOKEN_SECRET
    if len(secret) < 16:
        raise HTTPException(status_code=500, detail="PDF links are not configured")
    return secret.encode()


def _b64(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def _unb64(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def _sign(body: str) -> str:
    return _b64(hmac.new(_secret(), body.encode(), hashlib.sha256).digest())


def sign_token(claims: dict, ttl: int) -> str:
    body = _b64(json.dumps({**claims, "exp": int(time.time()) + ttl}, separators=(",", ":")).encode())
    return f"{body}.{_sign(body)}"


def verify_token(token: str, **expected) -> dict:
    """Returns the claims, or raises ForbiddenError. `expected` keys must match exactly (typ, cardId...)."""
    try:
        body, signature = token.split(".", 1)
        if not hmac.compare_digest(signature.encode(), _sign(body).encode()):
            raise ValueError("bad signature")
        claims = json.loads(_unb64(body))
    except HTTPException:
        raise
    except Exception:
        raise ForbiddenError("This link isn't valid")

    if claims.get("exp", 0) < time.time():
        raise ForbiddenError("This link has expired")
    for key, value in expected.items():
        if claims.get(key) != value:
            raise ForbiddenError("This link isn't valid")
    return claims