from datetime import datetime
from enum import Enum
from typing import Annotated, Literal, Union
from pydantic import BaseModel, Field

from .base import BaseClass, IdentifiedModel
from .template import TemplateCategory


# ---------------------------------------------------------------------
# Small reusable shape, used inside wedding-style details for
# multiple functions (mehendi, haldi, sangeet, etc.)
# ---------------------------------------------------------------------
class EventSchedule(BaseModel):
    name: str
    date: datetime
    startTime: str | None = None
    venueName: str | None = None
    venueAddress: str | None = None


# ---------------------------------------------------------------------
# Option 1 — wedding / reception / anniversary / engagement
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
    yearsTogether: int | None = None  # only meaningful for anniversary


# ---------------------------------------------------------------------
# Option 2 — birthday / baby shower
# ---------------------------------------------------------------------
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


# ---------------------------------------------------------------------
# The either/or field — Pydantic picks the right shape automatically
# based on the "category" value inside the submitted data.
# ---------------------------------------------------------------------
SpecificDetails = Annotated[
    Union[WeddingDetails, BirthdayDetails],
    Field(discriminator="category"),
]


# ---------------------------------------------------------------------
# MAIN CLASS — common fields + the specific details + category/template refs
# ---------------------------------------------------------------------
class CardDetails(BaseClass, IdentifiedModel):
    templateId: str
    templateCategory: TemplateCategory

    specificDetails: SpecificDetails

    # common fields, shared across every category
    invitationMessage: str | None = None
    rsvpContactName: str | None = None
    rsvpPhone: str | None = None
    rsvpEmail: str | None = None
    rsvpByDate: datetime | None = None
    dressCode: str | None = None
    additionalNotes: str | None = None
    language: str = "en"