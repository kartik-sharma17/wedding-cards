from pydantic import BaseModel

class tokenSchema(BaseModel):
    email: str
    userId: str
    userName: str