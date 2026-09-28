
from jose import jwt, JWTError, ExpiredSignatureError
from config import settings
from datetime import datetime, timedelta
from fastapi import HTTPException


async def GenerateEmailVerifyToken(email: str):
    expire = datetime.utcnow() + timedelta(minutes=settings.EMAIL_TOKEN_EXPIRE_MINUTES)
    data = {"sub": email, "exp": expire}
    return jwt.encode(data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


async def VerifyEmailToken(token):
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail={
                "status": False,
                "message": "Token expired, please try again",
                },
        )

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail={
                "status": False,
                "message": "Invalid Token Please Try Again",
                },
        )