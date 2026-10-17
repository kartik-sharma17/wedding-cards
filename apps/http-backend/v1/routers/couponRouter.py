from typing import Literal

from fastapi import APIRouter, Depends, Query

from v1.dependencies import verifyAdminDependency
from v1.schema import CreateCouponSchema, UpdateCouponSchema
from v1.services import admin_coupon_service

# Every route here needs an admin, so the check is applied to the whole router.
adminCouponRouter = APIRouter(
    prefix="/admin/coupons",
    tags=["Admin Coupons"],
    dependencies=[Depends(verifyAdminDependency)],
)


@adminCouponRouter.post("", summary="Create a coupon")
async def createCoupon(payload: CreateCouponSchema):
    return await admin_coupon_service.createCoupon(payload)


@adminCouponRouter.get("", summary="List coupons")
async def listCoupons(
    search: str | None = Query(default=None, max_length=40),
    status: Literal["active", "inactive"] | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
):
    return await admin_coupon_service.listCoupons(search, status, page, limit)


@adminCouponRouter.get("/{couponId}", summary="Read one coupon")
async def readCoupon(couponId: str):
    return await admin_coupon_service.readCoupon(couponId)


@adminCouponRouter.patch("/{couponId}", summary="Update a coupon")
async def updateCoupon(couponId: str, payload: UpdateCouponSchema):
    return await admin_coupon_service.updateCoupon(couponId, payload)


@adminCouponRouter.delete("/{couponId}", summary="Delete a coupon (deactivates it if it was already used)")
async def deleteCoupon(couponId: str):
    return await admin_coupon_service.deleteCoupon(couponId)