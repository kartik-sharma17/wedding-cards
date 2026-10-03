from bson import ObjectId
from bson.errors import InvalidId
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from v1.utility import VerifyToken, UnauthorizedError
from v1.db.connectDB import getDB

security = HTTPBearer()


async def verifyUserDependency(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials

    result = await VerifyToken(token)

    payload = result.get("data")
    userId = payload.get("userId") if payload else None

    if userId is None:
        raise UnauthorizedError("Invalid token")

    try:
        objectId = ObjectId(userId)
    except InvalidId:
        raise UnauthorizedError("Invalid token")

    db = getDB()
    user = await db["User"].find_one({"_id": objectId})

    if user is None:
        raise UnauthorizedError("User not found")

    return user
