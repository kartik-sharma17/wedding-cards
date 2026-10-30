from enum import Enum

from pydantic import EmailStr

from .base import BaseClass, IdentifiedModel


class ContactTopic(str, Enum):
    payment = "payment"
    card = "card"
    account = "account"
    feedback = "feedback"
    other = "other"


class ContactStatus(str, Enum):
    new = "new"
    in_progress = "in_progress"
    resolved = "resolved"


class ContactMessage(BaseClass, IdentifiedModel):
    name: str
    email: EmailStr
    phone: str | None = None
    topic: ContactTopic = ContactTopic.other
    message: str
    status: ContactStatus = ContactStatus.new