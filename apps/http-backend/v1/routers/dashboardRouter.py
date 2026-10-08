from fastapi import APIRouter, Depends

from v1.dependencies import verifyUserDependency
from v1.services import dashboard_service

dashboardRouter = APIRouter(prefix="/dashboard", tags=["dashboard"])


@dashboardRouter.get(
    "", summary="Logged-in user's dashboard (stats, recent cards, payments)"
)
async def getDashboard(user: dict = Depends(verifyUserDependency)):
    return await dashboard_service.GetDashboard(user)