from pydantic import EmailStr, Field, ConfigDict
from .base import BaseClass
from typing import Optional
from datetime import datetime


class User(BaseClass):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    full_name: str
    email: EmailStr
    password: str
    avatar: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False
    change_password_token: Optional[str] = None
    last_login: Optional[datetime] = None
