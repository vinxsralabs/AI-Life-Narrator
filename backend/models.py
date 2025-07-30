from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# User models
class UserBase(BaseModel):
    email: EmailStr
    username: str


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: User


class TokenData(BaseModel):
    user_id: Optional[int] = None


# Entry models
class EntryBase(BaseModel):
    text_content: Optional[str] = None
    story_style: str = "story"


class EntryCreate(EntryBase):
    pass


class Entry(EntryBase):
    id: int
    user_id: int
    date: datetime
    ai_generated_story: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Audio models
class AudioFileBase(BaseModel):
    transcription: Optional[str] = None
    duration: Optional[int] = None


class AudioFileCreate(AudioFileBase):
    pass


class AudioFile(AudioFileBase):
    id: int
    user_id: int
    entry_id: Optional[int] = None
    filename: str
    file_path: str
    created_at: datetime

    class Config:
        from_attributes = True


# Image models
class ImageBase(BaseModel):
    description: Optional[str] = None


class ImageCreate(ImageBase):
    pass


class Image(ImageBase):
    id: int
    user_id: int
    entry_id: Optional[int] = None
    filename: str
    file_path: str
    ai_generated_illustration: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Timeline models
class TimelineEntry(BaseModel):
    date: datetime
    entry: Optional[Entry] = None
    audio_files: List[AudioFile] = []
    images: List[Image] = []
    has_content: bool = False


class TimelineResponse(BaseModel):
    entries: List[TimelineEntry]
    total_entries: int


# Story generation models
class StoryGenerationRequest(BaseModel):
    entry_id: int
    style: str = "story"  # story, comic, poetic


class StoryGenerationResponse(BaseModel):
    story: str
    illustration_url: Optional[str] = None
    style: str


# Upload response models
class UploadResponse(BaseModel):
    success: bool
    message: str
    file_id: Optional[int] = None
    filename: Optional[str] = None
    transcription: Optional[str] = None


# Error models
class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
