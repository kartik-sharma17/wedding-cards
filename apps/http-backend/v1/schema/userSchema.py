from pydantic import BaseModel,EmailStr
from typing import Optional

class registerUser(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    avatar: Optional[str] = None
    phone: Optional[str] = None


class LoginSchema(BaseModel):
    email: EmailStr
    password: str