import re
from datetime import datetime, timezone

from pymongo.errors import DuplicateKeyError

from v1.db.connectDB import getDB
from v1.models import Coupon
from v1.schema import CreateCouponSchema, UpdateCouponSchema
from v1.utility import (
    response,
    toObjectId,
    NotFoundError,
    BadRequestError,
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _aware(value: datetime | None) -> datetime | None:
    """Mongo hands back naive UTC datetimes; make them explicit so JSON carries the offset."""
    if value is not None and value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def _validateRules(discountType: str, value: float, maxDiscount: float | None):
    if discountType == "percent" and not (0 < value <= 100):
        raise BadRequestError("A percent coupon must be between 1 and 100")
    if discountType == "flat" and maxDiscount is not None:
        raise BadRequestError("Max discount only applies to percent coupons")


class AdminCouponService:
    @property
    def coupons(self):
        return getDB()["Coupon"]

    # ------------------------------------------------------------------
    async def listCoupons(self, search: str | None, status: str | None, page: int, limit: int):
        query: dict = {}

        if search and search.strip():
            query["code"] = {"$regex": re.escape(search.strip()), "$options": "i"}

        # A missing isActive field counts as active (same rule the payment service uses).
        if status == "active":
            query["isActive"] = {"$ne": False}
        elif status == "inactive":
            query["isActive"] = False

        total = await self.coupons.count_documents(query)
        cursor = self.coupons.find(query).sort("_id", -1).skip((page - 1) * limit).limit(limit)
        items = [self._serialize(doc) async for doc in cursor]

        return response(
            message="Coupons fetched successfully",
            data={"items": items, "page": page, "limit": limit, "total": total},
        )

    # ------------------------------------------------------------------
    async def readCoupon(self, couponId: str):
        coupon = await self._get(couponId)
        return response(message="Coupon fetched successfully", data=self._serialize(coupon))

    # ------------------------------------------------------------------
    async def createCoupon(self, payload: CreateCouponSchema):
        _validateRules(payload.discountType, payload.value, payload.maxDiscount)

        expires = _aware(payload.expiresAt)
        if expires is not None and expires <= _now():
            raise BadRequestError("The expiry date must be in the future")

        if await self.coupons.find_one({"code": payload.code}, {"_id": 1}):
            raise BadRequestError("A coupon with this code already exists")

        # The model applies the defaults (redeemedCount = 0, plus whatever BaseClass adds).
        coupon = Coupon(
            code=payload.code,
            discountType=payload.discountType,
            value=payload.value,
            maxDiscount=payload.maxDiscount,
            isActive=payload.isActive,
            expiresAt=expires,
            maxRedemptions=payload.maxRedemptions,
        )

        # Mongo needs a plain dict, not the model object.
        doc = coupon.model_dump(by_alias=True)
        doc["discountType"] = payload.discountType  # store the plain string, not an Enum object
        for key in ("_id", "id"):
            if doc.get(key) is None:
                doc.pop(key, None)  # an empty id would be saved as _id: null, so let MongoDB generate it

        try:
            await self.coupons.insert_one(doc)  # adds doc["_id"]
        except DuplicateKeyError:
            raise BadRequestError("A coupon with this code already exists")

        return response(
            message="Coupon created successfully",
            data=self._serialize(doc),
            code=201,
        )

    # ------------------------------------------------------------------
    async def updateCoupon(self, couponId: str, payload: UpdateCouponSchema):
        coupon = await self._get(couponId)

        changes = payload.model_dump(exclude_unset=True)
        if not changes:
            raise BadRequestError("Nothing to update")

        for key in ("discountType", "value", "isActive"):
            if key in changes and changes[key] is None:
                raise BadRequestError(f"{key} can't be empty")

        if "expiresAt" in changes:
            changes["expiresAt"] = _aware(changes["expiresAt"])

        merged = {**coupon, **changes}

        # Switching to a flat coupon drops the percent-only cap.
        if merged["discountType"] == "flat":
            changes["maxDiscount"] = None
            merged["maxDiscount"] = None

        _validateRules(merged["discountType"], merged["value"], merged.get("maxDiscount"))

        used = coupon.get("redeemedCount", 0)
        limit = merged.get("maxRedemptions")
        if limit is not None and limit < used:
            raise BadRequestError(f"Max redemptions can't be lower than the {used} times it was already used")

        changes["updateAt"] = _now()
        await self.coupons.update_one({"_id": coupon["_id"]}, {"$set": changes})

        fresh = await self.coupons.find_one({"_id": coupon["_id"]})
        return response(message="Coupon updated successfully", data=self._serialize(fresh))

    # ------------------------------------------------------------------
    async def deleteCoupon(self, couponId: str):
        coupon = await self._get(couponId)

        # Used coupons are kept (switched off) so past payments still point at a real coupon.
        if coupon.get("redeemedCount", 0) > 0:
            await self.coupons.update_one(
                {"_id": coupon["_id"]},
                {"$set": {"isActive": False, "updateAt": _now()}},
            )
            return response(
                message=f"{coupon['code']} was already used, so it was deactivated instead of deleted",
                data={"deactivated": True},
            )

        await self.coupons.delete_one({"_id": coupon["_id"]})
        return response(message=f"{coupon['code']} was deleted", data={"deactivated": False})

    # ------------------------------------------------------------------
    async def _get(self, couponId: str) -> dict:
        coupon = await self.coupons.find_one({"_id": toObjectId(couponId, "Coupon not found")})
        if coupon is None:
            raise NotFoundError("Coupon not found")
        return coupon

    @staticmethod
    def _serialize(doc: dict) -> dict:
        now = _now()
        expires = _aware(doc.get("expiresAt"))
        used = doc.get("redeemedCount", 0)
        limit = doc.get("maxRedemptions")

        if not doc.get("isActive", True):
            state = "inactive"
        elif expires is not None and expires < now:
            state = "expired"
        elif limit is not None and used >= limit:
            state = "exhausted"
        else:
            state = "active"

        return {
            "id": str(doc["_id"]),
            "code": doc["code"],
            "discountType": doc.get("discountType"),
            "value": doc.get("value"),
            "maxDiscount": doc.get("maxDiscount"),
            "isActive": doc.get("isActive", True),
            "expiresAt": expires,
            "maxRedemptions": limit,
            "redeemedCount": used,
            "state": state,
            "createAt": _aware(doc.get("createAt")),
            "updateAt": _aware(doc.get("updateAt")),
        }


admin_coupon_service = AdminCouponService()