from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class Folder(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    owner_id: str
    name: str
    parent_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None