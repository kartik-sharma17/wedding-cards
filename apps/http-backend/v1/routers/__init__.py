from .auth import authrouter
from .templateRouter import templateRouter
from .cardRouter import cardRouter
from .dashboardRouter import dashboardRouter
from .adminTemplateRouter import adminTemplateRouter
from .paymentRouter import paymentRouter
from .couponRouter import adminCouponRouter

__all__ = [
    "authrouter",
    "templateRouter",
    "cardRouter",
    "dashboardRouter",
    "adminTemplateRouter",
    "paymentRouter",
    "adminCouponRouter"
]
