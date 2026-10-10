from fastapi import Depends

from v1.utility import ForbiddenError
from .verifyUserDependency import verifyUserDependency

ADMIN_ROLE = "admin"


async def verifyAdminDependency(user: dict = Depends(verifyUserDependency)):
    # Users created before roles existed have no "role" field, so they count as "user".
    if user.get("role", "user") != ADMIN_ROLE:
        raise ForbiddenError("Admin access required")

    return user
