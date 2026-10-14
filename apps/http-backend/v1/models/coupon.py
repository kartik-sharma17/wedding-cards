# v1/models/coupon.py  (same style as your Payment model; export it from v1/models/__init__.py)
from datetime import datetime
from enum import Enum

from .base import BaseClass, IdentifiedModel


class DiscountType(str, Enum):
    percent = "percent"  # value = 1..100
    flat = "flat"  # value = rupees off


class Coupon(BaseClass, IdentifiedModel):
    code: str  # stored UPPERCASE, e.g. "WELCOME20"
    discountType: DiscountType
    value: float
    maxDiscount: float | None = None  # optional cap for percent coupons, in rupees
    isActive: bool = True
    expiresAt: datetime | None = None
    maxRedemptions: int | None = None  # None = unlimited
    redeemedCount: int = 0