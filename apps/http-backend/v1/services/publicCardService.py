# v1/services/publicCardService.py
import hashlib
import hmac
import logging
import os
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Request
from pymongo.errors import DuplicateKeyError

from config import settings
from v1.db.connectDB import getDB
from v1.utility import response, toObjectId, NotFoundError

logger = logging.getLogger(__name__)

# The same visitor opening the card again within this time is not counted as a new view.
VIEW_WINDOW = timedelta(minutes=30)
# Internal fields guests never need.
HIDDEN_DETAIL_KEYS = {"_id", "cardId", "templateId"}


def _salt() -> bytes:
    """Secret mixed into the visitor hash. Uses VISITOR_SALT if you set it, else your PDF token secret."""
    value = (
        getattr(settings, "VISITOR_SALT", None)
        or getattr(settings, "PDF_TOKEN_SECRET", None)
        or os.getenv("VISITOR_SALT")
        or os.getenv("PDF_TOKEN_SECRET")
    )
    if not value:
        raise HTTPException(status_code=500, detail="Visitor tracking is not configured")
    return str(value).encode()


class PublicCardService:
    @property
    def cards(self):
        return getDB()["Card"]

    @property
    def details(self):
        return getDB()["CardDetails"]

    @property
    def templates(self):
        return getDB()["Template"]

    @property
    def visits(self):
        return getDB()["CardVisit"]

    # ------------------------------------------------------------------
    # GET /public/cards/{publicSlug}   (no login)
    # ------------------------------------------------------------------
    async def getPublicCard(self, request: Request, publicSlug: str):
        card = await self.cards.find_one({"publicSlug": publicSlug})
        if card is None:
            raise NotFoundError("This card link isn't valid")

        details = await self.details.find_one({"_id": toObjectId(card["cardDetailsId"], "Card not found")})
        template = await self.templates.find_one({"_id": toObjectId(card["templateId"], "Card not found")})
        if details is None or template is None:
            raise NotFoundError("This card link isn't valid")

        await self._countVisit(card, request)

        # Only what a guest needs: never the owner, payment info or internal ids.
        return response(
            message="Card fetched successfully",
            data={
                "templateSlug": template["slug"],
                "isPaid": bool(card.get("isPaid")),
                "details": {k: v for k, v in details.items() if k not in HIDDEN_DETAIL_KEYS},
            },
        )

    # ------------------------------------------------------------------
    # Visitor counting
    #   viewCount       : opens, but the same visitor is counted at most once per VIEW_WINDOW
    #   uniqueVisitors  : distinct visitors (by IP), each counted once
    # Raw IPs are never stored: only a salted hash per (card, IP).
    # ------------------------------------------------------------------
    async def _countVisit(self, card: dict, request: Request):
        try:
            ip = request.client.host if request.client else "unknown"
            cardId = str(card["_id"])
            visitor = hmac.new(_salt(), f"{cardId}|{ip}".encode(), hashlib.sha256).hexdigest()[:32]
            now = datetime.now(timezone.utc)

            # 1) a returning visitor whose last counted view is older than the window
            renewed = await self.visits.update_one(
                {"cardId": cardId, "visitor": visitor, "lastCountedAt": {"$lt": now - VIEW_WINDOW}},
                {"$set": {"lastCountedAt": now}, "$inc": {"count": 1}},
            )
            if renewed.modified_count == 1:
                await self.cards.update_one({"_id": card["_id"]}, {"$inc": {"viewCount": 1}})
                return

            # 2) a brand new visitor (the unique index makes this safe if two requests race)
            try:
                await self.visits.insert_one(
                    {"cardId": cardId, "visitor": visitor, "firstSeenAt": now, "lastCountedAt": now, "count": 1}
                )
            except DuplicateKeyError:
                return  # seen within the window: nothing to count
            await self.cards.update_one({"_id": card["_id"]}, {"$inc": {"viewCount": 1, "uniqueVisitors": 1}})
        except Exception as exc:  # counting must never stop a guest from seeing the card
            logger.warning("Visit counting failed: %r", exc)


public_card_service = PublicCardService()