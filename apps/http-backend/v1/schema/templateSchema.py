from typing import Any
from pydantic import BaseModel, Field

from v1.models.template import TemplateCategory, TemplateType


class TemplateSummary(BaseModel):
    id: str
    templateName: str
    category: TemplateCategory
    templateType: TemplateType
    current_version: int = 1
    price: float = 0
    currency: str = "INR"
    is_free: bool = False
    thumbnail_url: str | None = None
    preview_images: list[str] = Field(default_factory=list)


class TemplateDetail(TemplateSummary):
    max_photos: int = 0
    requires_video: bool = False
    supportedFields: list[str] = Field(default_factory=list)
    manifest: dict[str, Any] = Field(default_factory=dict)
