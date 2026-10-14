from typing import Any
from pydantic import Field
from enum import Enum
from .base import IdentifiedModel, BaseClass


class PaymentProvider(str, Enum):
    razorpay = "razorpay"
    stripe = "stripe"
    free = "free"  # nothing was charged: free template or a 100% coupon


class PaymentStatus(str, Enum):
    created = "created"
    paid = "paid"
    failed = "failed"
    refunded = "refunded"


class Payment(BaseClass, IdentifiedModel):
    cardId: str
    userId: str

    provider: PaymentProvider
    providerOrderId: str
    providerPaymentId: str | None = None

    # All amounts are in rupees (major units), not paise.
    amount: float  # what was actually charged (after the coupon)
    currency: str = "INR"
    status: PaymentStatus = PaymentStatus.created

    # coupon details, saved by the payment service
    couponCode: str | None = None
    originalAmount: float | None = None  # price before the coupon (None on older payments)
    discountAmount: float = 0.0

    gatewayEvents: list[dict[str, Any]] = Field(default_factory=list)
    # each entry: {"event": "payment.captured", "receivedAt": ..., "payload": {...}}

    failureReason: str | None = None