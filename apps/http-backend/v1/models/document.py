from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class Document(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    owner_id: str
    file_name: str
    url: str
    mime_type: str
    size: int
    is_public: bool = False
    share_token: Optional[str] = None 
    thumbnail_key: Optional[str] = None
    status: str = "uploading"          
    folder_id: Optional[str] = None 
    checksum: Optional[str] = None     
    is_deleted: bool = False        
    deleted_at: Optional[datetime] = None  
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        populate_by_name = True