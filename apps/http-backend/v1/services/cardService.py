import secrets

from v1.db.connectDB import getDB
from v1.schema import CreateCardSchema, UpdateCardSchema
from v1.utility import (
    response,
    toObjectId,
    NotFoundError,
    ForbiddenError,
    BadRequestError,
)


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
        card = await self.cards.find_one({"_id": toObjectId(cardId, "Card not found")})

        if card is None:
            raise NotFoundError("Card not found")

        if card["ownerId"] != str(user["_id"]):
            raise ForbiddenError("You don't have access to this card")

        details = await self.details.find_one(
            {"_id": toObjectId(card["cardDetailsId"], "Card details not found")}
        )

        if details is None:
            raise NotFoundError("Card details not found")

        card["_id"] = str(card["_id"])
        details["_id"] = str(details["_id"])

        return response(
            message="Card fetched successfully", data={"card": card, "details": details}
        )

    async def updateCard(self, user: dict, cardId: str, payload: UpdateCardSchema):
        card = await self.cards.find_one({"_id": toObjectId(cardId, "Card not found")})

        if card is None:
            raise NotFoundError("Card not found")

        if card["ownerId"] != str(user["_id"]):
            raise ForbiddenError("You don't have access to this card")

        update_data = payload.model_dump(exclude_unset=True, exclude_none=True)

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
                {"_id": toObjectId(card["cardDetailsId"], "Card details not found")},
                {"$set": details_fields},
            )

        return response(message="Card updated successfully")

    async def deleteCard(self, user: dict, cardId: str):
        card = await self.cards.find_one({"_id": toObjectId(cardId, "Card not found")})

        if card is None:
            raise NotFoundError("Card not found")

        if card["ownerId"] != str(user["_id"]):
            raise ForbiddenError("You don't have access to this card")

        await self.details.delete_one(
            {"_id": toObjectId(card["cardDetailsId"], "Card details not found")}
        )
        await self.cards.delete_one({"_id": card["_id"]})

        return response(message="Card deleted successfully")


card_service = CardService()
