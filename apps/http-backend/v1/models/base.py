from datetime import datetime
from time import timezone
from pydantic import BaseModel, Field

def timeZone():
    return datetime.now(timezone.utc)

class BaseClass(BaseModel):
    createAt: datetime = Field(default_factory=timeZone)
    updateAt: datetime = Field(default_factory=timeZone)