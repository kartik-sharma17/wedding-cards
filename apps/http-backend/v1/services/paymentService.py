import hashlib
import hmac
import logging
import os
import secrets
from datetime import datetime, timezone
from decimal import ROUND_HALF_UP, Decimal
from config import settings

import httpx
from fastapi import HTTPException

from v1.db.connectDB import getDB
from v1.models import PaymentProvider, PaymentStatus  # export them from v1/models/__init__.py if needed
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
PROVIDER_FREE = "free"  # add `free = "free"` to PaymentProvider (used when nothing is charged)
CREATED = PaymentStatus.created.value
PAID = PaymentStatus.paid.value
MIN_CHARGE = Decimal("1")  # Razorpay's minimum order is 1 rupee


def _credentials() -> tuple[str, str]:
    # Swap os.getenv for your own settings module if you have one.
    key_id = settings.RAZOR_PAY_API_KEY
    key_secret = settings.RAZOR_PAY_SECRET
    if not key_id or not key_secret:
        logger.error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set")
        raise HTTPException(status_code=500, detail="Payments are not configured")
    return key_id, key_secret


def _money(value) -> Decimal:
    return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _to_paise(amount) -> int:
    """Amounts are stored in rupees (major units); Razorpay and the API use paise."""
    return int((Decimal(str(amount)) * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _normalize_code(code: str | None) -> str | None:
    cleaned = (code or "").strip().upper()
    return cleaned or None


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

    @property
    def coupons(self):
        return getDB()["Coupon"]

    # ------------------------------------------------------------------
    # 0) Quote: what would this card cost (with an optional coupon)?
    # ------------------------------------------------------------------
    async def quote(self, user: dict, cardId: str, couponCode: str | None):
        card = await self._loadOwnedUnpaidCard(user, cardId)
        p = await self._price(card, _normalize_code(couponCode))
        return response(
            message="Quote ready",
            data={
                "currency": p["currency"],
                "originalAmount": _to_paise(p["original"]),
                "discountAmount": _to_paise(p["discount"]),
                "amount": _to_paise(p["final"]),
                "couponCode": p["couponCode"],
                "isFree": p["final"] <= 0,
            },
        )

    # ------------------------------------------------------------------
    # 1) Create order
    # ------------------------------------------------------------------
    async def createOrder(self, user: dict, payload: CreateOrderSchema):
        card = await self._loadOwnedUnpaidCard(user, payload.cardId)
        userId = str(user["_id"])

        # Price and coupon are ALWAYS decided here, never trusted from the client.
        p = await self._price(card, _normalize_code(payload.couponCode))
        extras = {
            "couponCode": p["couponCode"],
            "originalAmount": float(p["original"]),
            "discountAmount": float(p["discount"]),
        }

        # Free template or a 100% coupon: nothing to charge, unlock directly.
        if p["final"] <= 0:
            return await self._unlockFree(card, userId, p, extras)

        amount = float(p["final"])
        currency = p["currency"]
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
                "couponCode": p["couponCode"],
            },
            sort=[("_id", -1)],
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
                        "notes": {
                            "cardId": payload.cardId,
                            "userId": userId,
                            "coupon": p["couponCode"] or "",
                        },
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
            **extras,  # couponCode, originalAmount, discountAmount (add these to your Payment model)
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
        result = await self.payments.update_one(
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

        # Count the coupon use only once, when this request is the one that completed the payment.
        if result.modified_count == 1 and payment.get("couponCode"):
            await self._redeemCoupon(payment["couponCode"])

        return response(
            message="Payment verified successfully",
            data={"cardId": payment["cardId"], "isPaid": True},
        )

    # ------------------------------------------------------------------
    # pricing + coupons
    # ------------------------------------------------------------------
    async def _loadOwnedUnpaidCard(self, user: dict, cardId: str) -> dict:
        card = await self.cards.find_one({"_id": toObjectId(cardId, "Card not found")})
        if card is None:
            raise NotFoundError("Card not found")
        if card["ownerId"] != str(user["_id"]):
            raise ForbiddenError("You don't have access to this card")
        if card.get("isPaid"):
            raise BadRequestError("This card is already paid")
        return card

    async def _loadCoupon(self, code: str) -> dict:
        coupon = await self.coupons.find_one({"code": code})
        if coupon is None or not coupon.get("isActive", True):
            raise BadRequestError("This coupon code isn't valid")

        expires = coupon.get("expiresAt")
        if expires is not None:
            if expires.tzinfo is None:  # Mongo returns naive UTC datetimes
                expires = expires.replace(tzinfo=timezone.utc)
            if expires < _now():
                raise BadRequestError("This coupon has expired")

        limit = coupon.get("maxRedemptions")
        if limit is not None and coupon.get("redeemedCount", 0) >= limit:
            raise BadRequestError("This coupon has been fully redeemed")

        return coupon

    async def _price(self, card: dict, couponCode: str | None) -> dict:
        template = await self.templates.find_one(
            {"_id": toObjectId(card["templateId"], "Template not found")}
        )
        if template is None:
            raise NotFoundError("Template not found")

        price = Decimal("0") if template.get("is_free") else _money(template.get("price") or 0)
        currency = template.get("currency") or "INR"

        coupon = None
        discount = Decimal("0")

        if couponCode and price > 0:
            coupon = await self._loadCoupon(couponCode)
            if coupon["discountType"] == "percent":
                discount = price * _money(coupon["value"]) / 100
                cap = coupon.get("maxDiscount")
                if cap:
                    discount = min(discount, _money(cap))
            else:
                discount = _money(coupon["value"])
            discount = min(_money(discount), price)

        final = price - discount
        # Razorpay can't charge less than 1 rupee: a tiny remainder becomes exactly 1 rupee.
        if discount > 0 and 0 < final < MIN_CHARGE:
            final = MIN_CHARGE
            discount = price - final

        return {
            "original": price,
            "discount": discount,
            "final": final,
            "currency": currency,
            "couponCode": coupon["code"] if coupon else None,
        }

    async def _redeemCoupon(self, code: str):
        await self.coupons.update_one({"code": code}, {"$inc": {"redeemedCount": 1}})

    async def _unlockFree(self, card: dict, userId: str, p: dict, extras: dict):
        now = _now()
        doc = {
            "cardId": str(card["_id"]),
            "userId": userId,
            "provider": PROVIDER_FREE,
            "providerOrderId": f"free_{secrets.token_hex(10)}",
            "providerPaymentId": None,
            "amount": 0.0,
            "currency": p["currency"],
            "status": PAID,
            "gatewayEvents": [
                {
                    "event": "unlock.free",
                    "receivedAt": now,
                    "payload": {"couponCode": p["couponCode"]},
                }
            ],
            "failureReason": None,
            **extras,
        }
        await self.payments.insert_one(doc)  # adds doc["_id"]
        await self._markCardPaid(doc, now)
        if p["couponCode"]:
            await self._redeemCoupon(p["couponCode"])

        return response(
            message="Card unlocked successfully",
            data={"free": True, "amount": 0, "currency": p["currency"]},
        )

    # ------------------------------------------------------------------
    # helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _orderData(payment: dict, key_id: str) -> dict:
        return {
            "free": False,
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
                    "paymentId": str(payment["_id"]),  # id of the Payment document
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