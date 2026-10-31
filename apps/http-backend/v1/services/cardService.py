import secrets

from fastapi.encoders import jsonable_encoder

from v1.db.connectDB import getDB
from v1.models.base import timeZone
from v1.schema import CreateCardSchema, UpdateCardSchema
from v1.utility import (
    response,
    toObjectId,
    NotFoundError,
    ForbiddenError,
    BadRequestError,
)

LOCKED_MESSAGE = (
    "This card has been paid for, so it can no longer be edited. "
    "Please contact our support team for any changes"
)

# Sending null clears an optional field, but these can never be empty.
NOT_CLEARABLE = ("specificDetails", "language", "status", "customization", "photoUrls")


class CardService:
    @property
    def cards(self):
        return getDB()["Card"]

    @property
    def details(self):
        return getDB()["CardDetails"]

    @property
    def templates(self):
        return getDB()["Template"]

    async def findOwnedCard(self, user: dict, cardId: str):
        card = await self.cards.find_one({"_id": toObjectId(cardId, "Card not found")})

        # A deleted card behaves as if it never existed.
        if card is None or card.get("isDeleted"):
            raise NotFoundError("Card not found")

        if card["ownerId"] != str(user["_id"]):
            raise ForbiddenError("You don't have access to this card")

        return card

    async def createCard(self, user: dict, payload: CreateCardSchema):
        template = await self.templates.find_one(
            {"_id": toObjectId(payload.templateId, "Invalid template ID")}
        )

        if template is None or not template.get("is_active", True):
            raise NotFoundError("Template not found")

        if template.get("category") != payload.templateCategory:
            raise BadRequestError("Selected template does not match the given category")

        if payload.specificDetails.category != payload.templateCategory:
            raise BadRequestError(
                "specific Details category does not match template Category"
            )

        card_doc = {
            "ownerId": str(user["_id"]),
            "templateId": payload.templateId,
            "templateVersion": template.get("current_version", 1),
            "publicSlug": secrets.token_urlsafe(9),
            "customization": payload.customization,
            "photoUrls": [],
            "status": "draft",
            "isPaid": False,
            "paidAt": None,
            "paymentId": None,
            "viewCount": 0,
            "rsvpCount": 0,
            "isDeleted": False,
        }
        result = await self.cards.insert_one(card_doc)
        cardId = result.inserted_id

        details_doc = {
            "cardId": str(cardId),
            "templateId": payload.templateId,
            "templateCategory": payload.templateCategory,
            "specificDetails": payload.specificDetails.model_dump(),
            "invitationMessage": payload.invitationMessage,
            "rsvpContactName": payload.rsvpContactName,
            "rsvpPhone": payload.rsvpPhone,
            "rsvpEmail": payload.rsvpEmail,
            "rsvpByDate": payload.rsvpByDate,
            "dressCode": payload.dressCode,
            "additionalNotes": payload.additionalNotes,
            "language": payload.language,
        }
        details_result = await self.details.insert_one(details_doc)

        await self.cards.update_one(
            {"_id": cardId},
            {"$set": {"cardDetailsId": str(details_result.inserted_id)}},
        )

        return response(
            message="Card created successfully",
            data={"cardId": str(cardId), "publicSlug": card_doc["publicSlug"]},
        )

    async def readCard(self, user: dict, cardId: str):
        card = await self.findOwnedCard(user, cardId)

        details = await self.details.find_one(
            {"_id": toObjectId(card["cardDetailsId"], "Card details not found"), "isDeleted": {"$ne": True}}
        )

        if details is None:
            raise NotFoundError("Card details not found")

        card["_id"] = str(card["_id"])
        details["_id"] = str(details["_id"])

        # The details hold datetimes, which response() can't turn into JSON on its own.
        return response(
            message="Card fetched successfully",
            data=jsonable_encoder({"card": card, "details": details}),
        )

    async def updateCard(self, user: dict, cardId: str, payload: UpdateCardSchema):
        card = await self.findOwnedCard(user, cardId)

        # Editing is only allowed until the card is paid for.
        if card.get("isPaid"):
            raise ForbiddenError(LOCKED_MESSAGE)

        details = await self.details.find_one(
            {"_id": toObjectId(card["cardDetailsId"], "Card details not found")}
        )

        if details is None:
            raise NotFoundError("Card details not found")

        # null is kept on purpose: it clears an optional field such as dressCode.
        update_data = payload.model_dump(exclude_unset=True)

        for key in NOT_CLEARABLE:
            if key in update_data and update_data[key] is None:
                del update_data[key]

        specific = update_data.get("specificDetails")
        if specific is not None and specific["category"] != details["templateCategory"]:
            raise BadRequestError(
                "specific Details category does not match template Category"
            )

        card_fields = {}
        details_fields = {}

        for key in ("customization", "photoUrls", "status"):
            if key in update_data:
                card_fields[key] = update_data.pop(key)

        if "specificDetails" in update_data:
            details_fields["specificDetails"] = update_data.pop("specificDetails")

        details_fields.update(update_data)  # whatever's left belongs to CardDetails

        if card_fields:
            await self.cards.update_one({"_id": card["_id"]}, {"$set": card_fields})

        if details_fields:
            await self.details.update_one(
                {"_id": details["_id"]},
                {"$set": details_fields},
            )

        return response(message="Card updated successfully")

    async def deleteCard(self, user: dict, cardId: str):
        card = await self.findOwnedCard(user, cardId)

        # Soft delete, allowed whether or not the card is paid. Nothing is removed,
        # so payment records and the card's details stay intact.
        await self.cards.update_one(
            {"_id": card["_id"]},
            {"$set": {"isDeleted": True, "deletedAt": timeZone()}},
        )

        return response(message="Card deleted successfully")


card_service = CardService()
