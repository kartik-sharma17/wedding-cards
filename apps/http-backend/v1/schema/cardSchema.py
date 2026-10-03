from datetime import datetime
from enum import Enum
from typing import Annotated, Literal, Union

from pydantic import BaseModel, Field
from v1.models import TemplateCategory


class CardStatus(str, Enum):
    draft = "draft"
    published = "published"


# ---------------------------------------------------------------------
class EventSchedule(BaseModel):
    name: str
    date: datetime
    startTime: str | None = None
    venueName: str | None = None
    venueAddress: str | None = None


# ---------------------------------------------------------------------
class WeddingDetails(BaseModel):
    category: Literal[
        TemplateCategory.wedding,
        TemplateCategory.reception,
        TemplateCategory.anniversary,
        TemplateCategory.engagement,
    ]
    brideName: str
    groomName: str
    coupleHashtag: str | None = None
    brideParents: str | None = None
    groomParents: str | None = None
    hostLine: str | None = None
    eventDate: datetime
    venueName: str | None = None
    venueAddress: str | None = None
    mapUrl: str | None = None
    events: list[EventSchedule] = Field(default_factory=list)
    yearsTogether: int | None = None


class BirthdayDetails(BaseModel):
    category: Literal[TemplateCategory.birthday, TemplateCategory.baby_shower]
    celebrantName: str
    celebrantAge: int | None = None
    theme: str | None = None
    parentNames: str | None = None
    eventDate: datetime
    venueName: str | None = None
    venueAddress: str | None = None
    mapUrl: str | None = None


SpecificDetails = Annotated[
    Union[WeddingDetails, BirthdayDetails],
    Field(discriminator="category"),
]


# ---------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------
class CreateCardSchema(BaseModel):
    templateId: str
    templateCategory: TemplateCategory
    specificDetails: SpecificDetails

    invitationMessage: str | None = None
    rsvpContactName: str | None = None
    rsvpPhone: str | None = None
    rsvpEmail: str | None = None
    rsvpByDate: datetime | None = None
    dressCode: str | None = None
    additionalNotes: str | None = None
    language: str = "en"

    customization: dict = Field(default_factory=dict)


class UpdateCardSchema(BaseModel):
    specificDetails: SpecificDetails | None = None

    invitationMessage: str | None = None
    rsvpContactName: str | None = None
    rsvpPhone: str | None = None
    rsvpEmail: str | None = None
    rsvpByDate: datetime | None = None
    dressCode: str | None = None
    additionalNotes: str | None = None
    language: str | None = None

    customization: dict | None = None
    photoUrls: list[str] | None = None
    status: CardStatus | None = None