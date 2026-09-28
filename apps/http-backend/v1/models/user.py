from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class User(BaseModel):
    id: Optional[str] = Field(default=None,alias="_id")
    class Config:
        allow_population_by_field_name = True
    full_name: str
    email: EmailStr
    password: str
    avatar: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False
    change_password_token: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
