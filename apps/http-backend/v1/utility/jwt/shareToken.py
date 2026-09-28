from jose import jwt, JWTError, ExpiredSignatureError
from datetime import datetime, timedelta
from fastapi import HTTPException
from config import settings

MIN_EXPIRY_MINUTES = 5
MAX_EXPIRY_MINUTES = 60
DEFAULT_EXPIRY_MINUTES = 5


def GenerateShareToken(document_id: str, expires_minutes: int = DEFAULT_EXPIRY_MINUTES):
    expires_minutes = max(MIN_EXPIRY_MINUTES, min(expires_minutes, MAX_EXPIRY_MINUTES))

    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    payload = {
        "document_id": document_id,
        "type": "share",
        "exp": expire,
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token, expires_minutes


async def VerifyShareToken(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

        if payload.get("type") != "share":
            raise HTTPException(
                status_code=401,
                detail={"status": False, "message": "Invalid share token"},
            )

        return payload

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail={"status": False, "message": "Share link expired"},
        )
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail={"status": False, "message": "Invalid share token"},
        )