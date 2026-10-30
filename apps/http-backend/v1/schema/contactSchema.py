from pydantic import BaseModel, ConfigDict, EmailStr, Field

from v1.models import ContactTopic


class CreateContactSchema(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=20)
    topic: ContactTopic = ContactTopic.other
    message: str = Field(min_length=10, max_length=2000)

    # Honeypot: hidden in the form, so real people leave it empty. Bots fill it in.
    company: str | None = None