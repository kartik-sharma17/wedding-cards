from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field, model_validator

from v1.models.template import TemplateCategory, TemplateType


class TemplateSummary(BaseModel):
    id: str
    templateName: str
    slug: str
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


# ---------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------
SLUG_PATTERN = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"


class AdminTemplate(TemplateDetail):
    is_active: bool = True
    createAt: datetime | None = None
    updateAt: datetime | None = None


class CreateTemplateSchema(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    templateName: str = Field(min_length=2, max_length=80)
    slug: str = Field(min_length=2, max_length=80, pattern=SLUG_PATTERN)
    category: TemplateCategory
    templateType: TemplateType = TemplateType.card
    price: float = Field(default=0, ge=0)
    currency: str = "INR"
    is_free: bool = False
    max_photos: int = Field(default=0, ge=0, le=50)
    requires_video: bool = False
    is_active: bool = True
    supportedFields: list[str] = Field(default_factory=list)
    manifest: dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="after")
    def checkPrice(self):
        if not self.is_free and self.price <= 0:
            raise ValueError("Set a price greater than 0, or mark the template as free")
        return self


class UpdateTemplateSchema(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    templateName: str | None = Field(default=None, min_length=2, max_length=80)
    slug: str | None = Field(default=None, min_length=2, max_length=80, pattern=SLUG_PATTERN)
    category: TemplateCategory | None = None
    templateType: TemplateType | None = None
    price: float | None = Field(default=None, ge=0)
    currency: str | None = None
    is_free: bool | None = None
    max_photos: int | None = Field(default=None, ge=0, le=50)
    requires_video: bool | None = None
    is_active: bool | None = None
    supportedFields: list[str] | None = None
    manifest: dict[str, Any] | None = None

    # Preview URLs the admin wants to keep. Omit to keep every existing image.
    existingPreviewImages: list[str] | None = None
