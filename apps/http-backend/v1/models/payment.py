from typing import Any
from pydantic import Field
from enum import Enum
from .base import IdentifiedModel, BaseClass


class PaymentProvider(str, Enum):
    razorpay = "razorpay"
    stripe = "stripe"


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

    amount: float
    currency: str = "INR"
    status: PaymentStatus = PaymentStatus.created

    gatewayEvents: list[dict[str, Any]] = Field(default_factory=list)
    # each entry: {"event": "payment.captured", "receivedAt": ..., "payload": {...}}

    failureReason: str | None = None