from fastapi import APIRouter, Depends

from v1.dependencies import verifyUserDependency
from v1.schema import CreateOrderSchema, VerifyPaymentSchema
from v1.services import payment_service

paymentRouter = APIRouter(prefix="/payments", tags=["payments"])


@paymentRouter.post("/create-order", summary="Create a Razorpay order for a card")
async def createOrder(
    payload: CreateOrderSchema,
    user: dict = Depends(verifyUserDependency),
):
    return await payment_service.createOrder(user, payload)


@paymentRouter.post("/verify", summary="Verify the Razorpay signature and unlock the card")
async def verifyPayment(
    payload: VerifyPaymentSchema,
    user: dict = Depends(verifyUserDependency),
):
    return await payment_service.verifyPayment(user, payload)