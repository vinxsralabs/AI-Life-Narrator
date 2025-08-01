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


# Dashboard models
class DashboardStats(BaseModel):
    total_entries: int
    stories_generated: int
    weekly_streak: int = 0


# Error models
class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None


# Narrative models
class NarrativeRequest(BaseModel):
    entries: List[dict]
    start_date: str
    end_date: str


class NarrativeResponse(BaseModel):
    narrative: str
    period: str


class AudioRequest(BaseModel):
    text: str


class ImageRequest(BaseModel):
    text: str


class ImageResponse(BaseModel):
    image_url: str


class NarrativeHistory(BaseModel):
    id: int
    start_date: datetime
    end_date: datetime
    narrative_text: str
    audio_url: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NarrativeHistoryResponse(BaseModel):
    narratives: List[NarrativeHistory]
    total_count: int


# Therapy models
class TherapyChatRequest(BaseModel):
    message: str
    message_type: str = "text"  # "text" or "audio"


class TherapyChatResponse(BaseModel):
    response: str
    timestamp: datetime


# Mood tracking models
class MoodEntryBase(BaseModel):
    mood_value: int  # 1-5 scale (1=very sad, 2=sad, 3=neutral, 4=happy, 5=very happy)
    mood_emoji: str  # Emoji representation
    mood_note: Optional[str] = None  # Optional note about the mood
    date: datetime


class MoodEntryCreate(MoodEntryBase):
    pass


class MoodEntry(MoodEntryBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Highlights models
class HighlightBase(BaseModel):
    entry_id: Optional[int] = None
    highlight_type: str  # "memory", "photo", "audio", "achievement"
    title: str
    description: Optional[str] = None
    is_favorite: bool = False


class HighlightCreate(HighlightBase):
    pass


class Highlight(HighlightBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# API Request/Response models for My Reflections
class MoodStatsResponse(BaseModel):
    average_mood: float
    mood_trend: str  # "improving", "declining", "stable"
    total_entries: int
    mood_distribution: dict  # {1: count, 2: count, ...}


class HighlightsResponse(BaseModel):
    recent_highlights: List[dict]
    on_this_day: List[dict]
    weekly_summary: Optional[str]
    mood_insights: Optional[str]
