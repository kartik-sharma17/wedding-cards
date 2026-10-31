from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import Field

from .base import BaseClass, IdentifiedModel


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
    publishedAt: datetime | None = None

    isPaid: bool = False
    paidAt: datetime | None = None
    paymentId: str | None = None

    viewCount: int = 0
    rsvpCount: int = 0

    # Soft delete: the document is kept, but hidden everywhere.
    isDeleted: bool = False
    deletedAt: datetime | None = None