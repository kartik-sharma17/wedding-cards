from fastapi import APIRouter

from v1.schema.contactSchema import CreateContactSchema
from v1.services import contact_service

contactRouter = APIRouter(prefix="/contact", tags=["contact"])


@contactRouter.post("", summary="Submit a contact / support message (public)")
async def createContactMessage(payload: CreateContactSchema):
    return await contact_service.CreateMessage(payload)