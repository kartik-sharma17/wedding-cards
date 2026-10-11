import hashlib
import hmac
import logging
import os
from datetime import datetime, timezone
from decimal import ROUND_HALF_UP, Decimal
from config import settings

import httpx
from fastapi import HTTPException

from v1.db.connectDB import getDB
from v1.models import PaymentProvider, PaymentStatus
from v1.schema import CreateOrderSchema, VerifyPaymentSchema
from v1.utility import (
    response,
    toObjectId,
    NotFoundError,
    ForbiddenError,
    BadRequestError,
)

logger = logging.getLogger(__name__)

RAZORPAY_API = settings.RAZORPAY_API
PROVIDER = PaymentProvider.razorpay.value
CREATED = PaymentStatus.created.value
PAID = PaymentStatus.paid.value


def _credentials() -> tuple[str, str]:
    # Swap os.getenv for your own settings module if you have one.
    key_id = settings.RAZOR_PAY_API_KEY
    key_secret = settings.RAZOR_PAY_SECRET
    if not key_id or not key_secret:
        logger.error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set")
        raise HTTPException(status_code=500, detail="Payments are not configured")
    return key_id, key_secret


def _to_paise(amount) -> int:
    """Payment.amount is in rupees (major units); Razorpay wants paise (minor units)."""
    return int((Decimal(str(amount)) * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def _now() -> datetime:
    return datetime.now(timezone.utc)


class PaymentService:
    @property
    def cards(self):
        return getDB()["Card"]

    @property
    def templates(self):
        return getDB()["Template"]

    @property
    def payments(self):
        return getDB()["Payment"]

    # ------------------------------------------------------------------
    # 1) Create order
    # ------------------------------------------------------------------
    async def createOrder(self, user: dict, payload: CreateOrderSchema):
        card = await self.cards.find_one(
            {"_id": toObjectId(payload.cardId, "Card not found")}
        )
        if card is None:
            raise NotFoundError("Card not found")

        userId = str(user["_id"])
        if card["ownerId"] != userId:
            raise ForbiddenError("You don't have access to this card")

        if card.get("isPaid"):
            raise BadRequestError("This card is already paid")

        # The price is ALWAYS read from the database, never from the client.
        template = await self.templates.find_one(
            {"_id": toObjectId(card["templateId"], "Template not found")}
        )
        if template is None:
            raise NotFoundError("Template not found")

        price = template.get("price") or 0
        if template.get("is_free") or price <= 0:
            raise BadRequestError("This template is free, so no payment is needed")

        amount = float(price)  # rupees, matches Payment.amount
        currency = template.get("currency") or "INR"
        key_id, key_secret = _credentials()

        # Double-clicks / retries reuse the open order instead of creating orphans.
        existing = await self.payments.find_one(
            {
                "cardId": payload.cardId,
                "userId": userId,
                "provider": PROVIDER,
                "status": CREATED,
                "amount": amount,
                "currency": currency,
            },
            sort=[("_id", -1)],  # newest first
        )
        if existing:
            return response(
                message="Order created successfully",
                data=self._orderData(existing, key_id),
            )

        try:
            async with httpx.AsyncClient(timeout=15) as client:
                res = await client.post(
                    f"{RAZORPAY_API}/orders",
                    auth=(key_id, key_secret),
                    json={
                        "amount": _to_paise(amount),
                        "currency": currency,
                        "receipt": f"card_{payload.cardId}"[:40],
                        "notes": {"cardId": payload.cardId, "userId": userId},
                    },
                )
        except httpx.HTTPError as exc:
            logger.error("Razorpay order request failed: %s", exc)
            raise HTTPException(
                status_code=502,
                detail="Could not reach the payment gateway. Please try again.",
            )

        if res.status_code != 200:
            logger.error("Razorpay order failed: %s %s", res.status_code, res.text)
            raise HTTPException(
                status_code=502,
                detail="Could not create the payment order. Please try again.",
            )

        order = res.json()

        payment_doc = {
            "cardId": payload.cardId,
            "userId": userId,
            "provider": PROVIDER,
            "providerOrderId": order["id"],
            "providerPaymentId": None,
            "amount": amount,
            "currency": currency,
            "status": CREATED,
            "gatewayEvents": [],
            "failureReason": None,
        }
        await self.payments.insert_one(payment_doc)

        return response(
            message="Order created successfully",
            data=self._orderData(payment_doc, key_id),
        )

    # ------------------------------------------------------------------
    # 2) Verify payment
    # ------------------------------------------------------------------
    async def verifyPayment(self, user: dict, payload: VerifyPaymentSchema):
        payment = await self.payments.find_one(
            {"provider": PROVIDER, "providerOrderId": payload.razorpay_order_id}
        )
        if payment is None:
            raise NotFoundError("Payment order not found")

        if payment["userId"] != str(user["_id"]):
            raise ForbiddenError("You don't have access to this payment")

        # Already verified (double submit or a retry): just make sure the card is unlocked.
        if payment["status"] == PAID:
            await self._markCardPaid(payment)
            return response(
                message="Payment already verified",
                data={"cardId": payment["cardId"], "isPaid": True},
            )

        key_id, key_secret = _credentials()

        expected = hmac.new(
            key_secret.encode(),
            f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}".encode(),
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(
            expected.encode(), payload.razorpay_signature.encode()
        ):
            logger.warning(
                "Bad Razorpay signature for order %s", payment["providerOrderId"]
            )
            raise BadRequestError("Payment verification failed")

        # Best effort: keep Razorpay's full payment object for the records.
        gateway = await self._fetchGatewayPayment(
            payload.razorpay_payment_id, key_id, key_secret
        )
        if gateway and gateway.get("amount") not in (
            None,
            _to_paise(payment["amount"]),
        ):
            logger.error("Amount mismatch on order %s", payment["providerOrderId"])
            raise BadRequestError("Payment amount does not match the order")

        paid_at = _now()
        await self.payments.update_one(
            {"_id": payment["_id"], "status": CREATED},  # only the first request wins
            {
                "$set": {
                    "status": PAID,
                    "providerPaymentId": payload.razorpay_payment_id,
                    "failureReason": None,
                },
                "$push": {
                    "gatewayEvents": {
                        "event": "payment.verified",
                        "receivedAt": paid_at,
                        "payload": gateway or payload.model_dump(),
                    }
                },
            },
        )
        await self._markCardPaid(payment, paid_at)

        return response(
            message="Payment verified successfully",
            data={"cardId": payment["cardId"], "isPaid": True},
        )

    # ------------------------------------------------------------------
    # helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _orderData(payment: dict, key_id: str) -> dict:
        # The API response keys are unchanged, so the frontend needs no edits.
        return {
            "orderId": payment["providerOrderId"],
            "amount": _to_paise(payment["amount"]),  # Razorpay Checkout wants paise
            "currency": payment["currency"],
            "keyId": key_id,  # public key, safe to send to the browser
        }

    async def _markCardPaid(self, payment: dict, paid_at: datetime | None = None):
        await self.cards.update_one(
            # the isPaid filter keeps the original paidAt on repeated calls
            {
                "_id": toObjectId(payment["cardId"], "Card not found"),
                "isPaid": {"$ne": True},
            },
            {
                "$set": {
                    "isPaid": True,
                    "paidAt": paid_at or _now(),
                    "paymentId": str(payment["_id"]),
                }
            },
        )

    @staticmethod
    async def _fetchGatewayPayment(paymentId: str, key_id: str, key_secret: str):
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                res = await client.get(
                    f"{RAZORPAY_API}/payments/{paymentId}", auth=(key_id, key_secret)
                )
            if res.status_code == 200:
                return res.json()
            logger.warning("Razorpay payment fetch: %s %s", res.status_code, res.text)
        except httpx.HTTPError as exc:
            logger.warning("Razorpay payment fetch failed: %s", exc)
        return None


payment_service = PaymentService()