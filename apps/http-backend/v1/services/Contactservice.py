from datetime import datetime, timedelta, timezone

from bson import ObjectId

from v1.db.connectDB import getDB
from v1.models.contact import ContactMessage
from v1.schema.contactSchema import CreateContactSchema
from v1.utility import response, BadRequestError

MAX_MESSAGES_PER_HOUR = 5
SUCCESS_MESSAGE = "Thanks, we've received your message and will get back to you soon."


class ContactService:
    @property
    def collection(self):
        return getDB()["ContactMessage"]

    async def CreateMessage(self, payload: CreateContactSchema):
        # Honeypot filled in: pretend it worked, store nothing.
        if payload.company:
            return response(message=SUCCESS_MESSAGE)

        email = payload.email.lower()

        # Basic spam guard: limit messages per email per hour.
        # An ObjectId embeds its creation time, so this needs no date field.
        cutoff = ObjectId.from_datetime(datetime.now(timezone.utc) - timedelta(hours=1))
        recent = await self.collection.count_documents(
            {"email": email, "_id": {"$gte": cutoff}}
        )
        if recent >= MAX_MESSAGES_PER_HOUR:
            raise BadRequestError("Too many messages. Please try again later.")

        contact = ContactMessage(
            name=payload.name,
            email=email,
            phone=payload.phone,
            topic=payload.topic,
            message=payload.message,
        )
        result = await self.collection.insert_one(
            contact.model_dump(by_alias=True, exclude={"id"})
        )

        # TODO: notify the support inbox here, using the same mail helper the
        # auth service uses for verification emails.

        return response(message=SUCCESS_MESSAGE, data={"id": str(result.inserted_id)})


contact_service = ContactService()