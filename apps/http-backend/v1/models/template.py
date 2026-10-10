from enum import Enum
from typing import Any

from pydantic import Field

from .base import BaseClass, IdentifiedModel


class TemplateCategory(str, Enum):
    wedding = "wedding"
    reception = "reception"
    anniversary = "anniversary"
    engagement = "engagement"
    birthday = "birthday"
    baby_shower = "baby_shower"


class TemplateType(str, Enum):
    card = "card"
    video = "video"


class Template(BaseClass, IdentifiedModel):
    templateName: str
    slug: str
    category: TemplateCategory = TemplateCategory.wedding
    templateType: TemplateType = TemplateType.card
    current_version: int = 1
    price: float = 0
    currency: str = "INR"
    is_free: bool = False
    thumbnail_url: str | None = None
    preview_images: list[str] = Field(default_factory=list)
    max_photos: int = 0
    requires_video: bool = False
    is_active: bool = True
    supportedFields: list[str] = Field(default_factory=list)
    manifest: dict[str, Any] = Field(default_factory=dict)
