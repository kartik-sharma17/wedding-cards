import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

CODE_PATTERN = re.compile(r"^[A-Z0-9_-]{3,40}$")
DiscountTypeLiteral = Literal["percent", "flat"]


class CreateCouponSchema(BaseModel):
    code: str
    discountType: DiscountTypeLiteral
    value: float = Field(gt=0)  # percent (1..100) or rupees off
    maxDiscount: float | None = Field(default=None, gt=0)  # percent coupons only
    isActive: bool = True
    expiresAt: datetime | None = None
    maxRedemptions: int | None = Field(default=None, ge=1)  # None = unlimited

    @field_validator("code")
    @classmethod
    def normalizeCode(cls, v: str) -> str:
        v = v.strip().upper()
        if not CODE_PATTERN.match(v):
            raise ValueError("Code must be 3-40 characters: letters, numbers, '-' or '_'")
        return v


class UpdateCouponSchema(BaseModel):
    """PATCH body. The code is deliberately not editable: payments store it as a reference.
    Send an explicit null for maxDiscount / expiresAt / maxRedemptions to clear them."""

    discountType: DiscountTypeLiteral | None = None
    value: float | None = Field(default=None, gt=0)
    maxDiscount: float | None = Field(default=None, gt=0)
    isActive: bool | None = None
    expiresAt: datetime | None = None
    maxRedemptions: int | None = Field(default=None, ge=1)