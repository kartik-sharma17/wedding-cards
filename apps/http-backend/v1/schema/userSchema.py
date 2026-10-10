from pydantic import BaseModel,EmailStr
from typing import Optional
from v1.models.user import UserRole

class registerUser(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    avatar: Optional[str] = None
    phone: Optional[str] = None


class LoginSchema(BaseModel):
    email: EmailStr
    password: str

class AuthMe(BaseModel):
    email: Optional[EmailStr]
    role: Optional[UserRole]