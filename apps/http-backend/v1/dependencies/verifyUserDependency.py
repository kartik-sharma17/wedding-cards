from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from v1.utility import VerifyToken, log
from v1.db.connectDB import getDB

security = HTTPBearer()


async def verifyUserDependency(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials

    try:
        result = await VerifyToken(token)
        
        payload = result.get("data")
        userId = payload.get("userId") if payload else None

        if userId is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"status": False, "message": "Invalid token payload"},
            )

        db = getDB()
        user = await db["User"].find_one({"_id": ObjectId(userId)})

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"status": False, "message": "User not found"},
            )

        return user

    except HTTPException:
        raise
    except Exception as e:
        log.info(f"this is a issue {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"status": False, "message": "Something went wrong while verifying user"},
        )