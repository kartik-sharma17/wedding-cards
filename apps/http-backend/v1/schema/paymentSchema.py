from pydantic import BaseModel, Field


class CreateOrderSchema(BaseModel):
    cardId: str = Field(min_length=1)


class VerifyPaymentSchema(BaseModel):
    """The three values Razorpay Checkout hands to the frontend after a successful payment."""

    razorpay_order_id: str = Field(min_length=1)
    razorpay_payment_id: str = Field(min_length=1)
    razorpay_signature: str = Field(min_length=1)