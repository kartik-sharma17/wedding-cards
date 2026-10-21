from fastapi import APIRouter

from . import (
    cardRouter,
    templateRouter,
    authrouter,
    dashboardRouter,
    adminTemplateRouter,
    paymentRouter,
    adminCouponRouter,
    pdfRouter,
    publicRouter
)

router = APIRouter()

router.include_router(cardRouter)
router.include_router(templateRouter)
router.include_router(authrouter)
router.include_router(dashboardRouter)
router.include_router(adminTemplateRouter)
router.include_router(paymentRouter)
router.include_router(adminCouponRouter)
router.include_router(pdfRouter)
router.include_router(publicRouter)
