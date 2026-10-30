from .auth import authrouter
from .templateRouter import templateRouter
from .cardRouter import cardRouter
from .dashboardRouter import dashboardRouter
from .adminTemplateRouter import adminTemplateRouter
from .paymentRouter import paymentRouter
from .couponRouter import adminCouponRouter
from .pdfRouter import pdfRouter
from .publicRouter import publicRouter
from .contactRouter import contactRouter

__all__ = [
    "authrouter",
    "templateRouter",
    "cardRouter",
    "dashboardRouter",
    "adminTemplateRouter",
    "paymentRouter",
    "adminCouponRouter",
    "pdfRouter",
    "publicRouter",
    "contactRouter"
]
