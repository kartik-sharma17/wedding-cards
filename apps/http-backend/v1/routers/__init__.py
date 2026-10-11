from .auth import authrouter
from .templateRouter import templateRouter
from .cardRouter import cardRouter
from .dashboardRouter import dashboardRouter
from .adminTemplateRouter import adminTemplateRouter
from .paymentRouter import paymentRouter

__all__ = [
    "authrouter",
    "templateRouter",
    "cardRouter",
    "dashboardRouter",
    "adminTemplateRouter",
    "paymentRouter"
]
