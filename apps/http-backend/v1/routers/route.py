from fastapi import APIRouter

from . import cardRouter, templateRouter, authrouter, dashboardRouter

router = APIRouter()

router.include_router(cardRouter)
router.include_router(templateRouter)
router.include_router(authrouter)
router.include_router(dashboardRouter)
