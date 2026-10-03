# from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

# from v1.models.rsvp import RsvpStatus


# class RsvpCreate(BaseModel):
#     guestName: str = Field(min_length=1, max_length=100)
#     phone: str | None = Field(default=None, max_length=20)
#     email: EmailStr | None = None
#     status: RsvpStatus
#     guestCount: int = Field(default=1, ge=0, le=20)
#     message: str | None = Field(default=None, max_length=500)

#     @field_validator("guestName", "phone", "message", mode="before")
#     @classmethod
#     def _strip(cls, v):
#         if isinstance(v, str):
#             v = v.strip()
#             return v or None
#         return v

#     @model_validator(mode="after")
#     def _check(self):
#         if not self.guestName:
#             raise ValueError("guestName is required")
#         if not self.phone and not self.email:
#             raise ValueError("Provide a phone number or an email")
#         if self.email:
#             self.email = self.email.lower()
#         if self.status == RsvpStatus.declined:
#             self.guestCount = 0
#         elif self.guestCount < 1:
#             raise ValueError("guestCount must be at least 1 when attending or maybe")
#         return self


# class RsvpOut(BaseModel):
#     guestName: str
#     status: RsvpStatus
#     guestCount: int
