from typing import Optional
from pydantic import BaseModel, Field
from .base import BaseClass

class category():
    wedding = "wedding"
    birthday = "birthday"
    gettogether = "gettogether"

class templateType():
    card = "card"
    video = "video"

class Template(BaseClass):
    templateName: str
    templateId: Optional[str] = Field(alies="_id") # this help to populate from _id
    price: int
    category: category = Field(default_factory=category.wedding)
    templateType: templateType = Field(default_factory=templateType.card)
    current_version: int = 1
    price: float = 0
    currency: str = "INR"
    is_free: bool = False
    thumbnail_url: str | None = None                  
    preview_images: list[str] = Field(default_factory=list)  
    max_photos: int = 0
    requires_video: bool = False
    is_active: bool = True  
    