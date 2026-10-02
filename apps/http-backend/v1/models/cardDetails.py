from datetime import datetime
from enum import Enum
from typing import Annotated, Literal, Union
from pydantic import BaseModel, Field
from .base import BaseClass, IdentifiedModel


class CardCategory(str, Enum):
    wedding = "wedding"
    reception = "reception"
    anniversary = "anniversary"
    engagement = "engagement"
    birthday = "birthday"
    baby_shower = "baby_shower"


class WeddingEvent(BaseModel):
    name: str
    date: datetime
    startTime: str | None = None
    venueName: str | None = None
    venueAddress: str | None = None


# ---- Shape 1: couple-based events (wedding, reception, anniversary, engagement) ----
class CoupleEventFields(BaseModel):
    category: Literal[
        CardCategory.wedding,
        CardCategory.reception,
        CardCategory.anniversary,
        CardCategory.engagement,
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
    events: list[WeddingEvent] = Field(default_factory=list)
    yearsTogether: int | None = None   # only meaningful for anniversary, harmless elsewhere


# ---- Shape 2: birthday / baby shower (celebrant-based, no "couple") ----
class CelebrantEventFields(BaseModel):
    category: Literal[CardCategory.birthday, CardCategory.baby_shower]
    celebrantName: str
    celebrantAge: int | None = None
    theme: str | None = None           # "superhero", "princess", "jungle"
    parentNames: str | None = None     # relevant for kids' birthdays / baby showers
    eventDate: datetime
    venueName: str | None = None
    venueAddress: str | None = None
    mapUrl: str | None = None


# ---- Fields common to every category, regardless of shape ----
class CommonCardFields(BaseModel):
    invitationMessage: str | None = None
    rsvpContactName: str | None = None
    rsvpPhone: str | None = None
    rsvpEmail: str | None = None
    rsvpByDate: datetime | None = None
    dressCode: str | None = None
    additionalNotes: str | None = None
    language: str = "en"


# ---- The discriminated union, keyed on `category` ----
CategorySpecificFields = Annotated[
    Union[CoupleEventFields, CelebrantEventFields],
    Field(discriminator="category"),
]


class CardDetails(BaseClass, IdentifiedModel, CommonCardFields):
    cardId: str
    specifics: CategorySpecificFields