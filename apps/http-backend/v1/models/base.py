from datetime import datetime
from time import timezone
from pydantic import BaseModel, Field, ConfigDict

def timeZone():
    return datetime.now(timezone.utc)

class BaseClass(BaseModel):
    createAt: datetime = Field(default_factory=timeZone)
    updateAt: datetime = Field(default_factory=timeZone)

class IdentifiedModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str = Field(alias="_id")