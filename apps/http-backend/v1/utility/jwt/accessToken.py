from jose import jwt, JWTError, ExpiredSignatureError
from config import settings
from datetime import datetime, timedelta
from v1.schema import tokenSchema
from fastapi import HTTPException


def GenerateToken(data: tokenSchema, expires_delta=settings.ACCESS_EXPIRE_MINUTES):
    copyData = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_delta)
    copyData["exp"] = expire
    return jwt.encode(copyData, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


async def VerifyToken(token):
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return {"status": True, "data": payload}

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail={
                "status": False,
                "message": "Token expired, please login again",
                "data": None,
            },
        )

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail={
                "status": False,
                "message": "invalid Token, please try again",
                "data": None,
            },
        )
