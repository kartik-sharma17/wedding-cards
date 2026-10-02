from datetime import datetime
from .base import BaseClass, IdentifiedModel
from pydantic import Field
from typing import Any


class CardStatus(str, Enum):
    draft = "draft"
    published = "published"


class Card(BaseClass, IdentifiedModel):
    ownerId: str
    templateId: str
    templateVersion: int
    cardDetailsId: str              # references CardDetails._id

    publicSlug: str
    customization: dict[str, Any] = Field(default_factory=dict)
    photoUrls: list[str] = Field(default_factory=list)

    status: CardStatus = CardStatus.draft

    isPaid: bool = False
    paidAt: datetime | None = None
    paymentId: str | None = None

    viewCount: int = 0
    rsvpCount: int = 0