from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.responses import FileResponse, Response
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import os
import shutil
import uuid
from pathlib import Path

from database import get_db, User, Entry, AudioFile, Image, Narrative, init_db, seed_demo_data
from auth import (
    get_current_active_user,
    authenticate_user,
    create_access_token,
    get_password_hash,
)
from models import (
    UserCreate,
    UserLogin,
    Token,
    User as UserModel,
    EntryCreate,
    Entry as EntryModel,
    AudioFile as AudioFileModel,
    Image as ImageModel,
    TimelineResponse,
    StoryGenerationRequest,
    StoryGenerationResponse,
    UploadResponse,
    DashboardStats,
    NarrativeRequest,
    NarrativeResponse,
    AudioRequest,
    ImageRequest,
    ImageResponse,
    NarrativeHistory,
    NarrativeHistoryResponse,
)
from ai_service import ai_service

router = APIRouter()
security = HTTPBearer()


# Authentication routes
@router.post("/register", response_model=Token)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = (
        db.query(User)
        .filter((User.email == user_data.email) | (User.username == user_data.username))
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or username already exists",
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    # Create access token
    access_token = create_access_token(data={"sub": user.id})

    return Token(access_token=access_token, token_type="bearer", user=user)


@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login user"""
    user = authenticate_user(db, user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    access_token = create_access_token(data={"sub": user.id})

    return Token(access_token=access_token, token_type="bearer", user=user)


@router.get("/me", response_model=UserModel)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    return current_user


@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get dashboard statistics"""
    # Get total entries
    total_entries = db.query(Entry).filter(Entry.user_id == current_user.id).count()
    
    # Get entries with AI generated stories
    stories_generated = db.query(Entry).filter(
        Entry.user_id == current_user.id,
        Entry.ai_generated_story.isnot(None)
    ).count()
    
    # Calculate weekly streak (entries in the last 7 days)
    from datetime import datetime, timedelta
    week_ago = datetime.now() - timedelta(days=7)
    weekly_streak = db.query(Entry).filter(
        Entry.user_id == current_user.id,
        Entry.date >= week_ago
    ).count()
    
    return DashboardStats(
        total_entries=total_entries,
        stories_generated=stories_generated,
        weekly_streak=weekly_streak
    )


# Entry routes
@router.post("/entries", response_model=EntryModel)
async def create_entry(
    entry_data: EntryCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create a new diary entry"""
    entry = Entry(
        user_id=current_user.id,
        text_content=entry_data.text_content,
        story_style=entry_data.story_style,
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)

    return entry


@router.get("/entries", response_model=List[EntryModel])
async def get_entries(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    """Get user's diary entries"""
    entries = (
        db.query(Entry)
        .filter(Entry.user_id == current_user.id)
        .order_by(Entry.date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return entries


@router.get("/entries/{entry_id}", response_model=EntryModel)
async def get_entry(
    entry_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get a specific diary entry"""
    entry = (
        db.query(Entry)
        .filter(Entry.id == entry_id, Entry.user_id == current_user.id)
        .first()
    )

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found"
        )

    return entry


# Audio upload and transcription
@router.post("/upload/audio", response_model=UploadResponse)
async def upload_audio(
    file: UploadFile = File(...),
    entry_id: Optional[int] = None,
    create_entry: bool = False,
    story_style: str = "story",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Upload and transcribe audio file"""

    # Validate file type
    if not file.content_type.startswith("audio/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="File must be an audio file"
        )

    # Create unique filename
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"

    # Save file
    upload_dir = os.getenv("UPLOAD_DIR", "./uploads")
    audio_dir = os.path.join(upload_dir, "audio")
    
    # Create directories if they don't exist
    os.makedirs(audio_dir, exist_ok=True)
    
    file_path = os.path.join(audio_dir, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Transcribe audio
    transcription = await ai_service.transcribe_audio(file_path)

    # Create entry from transcription if requested
    if create_entry and transcription:
        entry = Entry(
            user_id=current_user.id,
            text_content=transcription,
            story_style=story_style,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        entry_id = entry.id
    elif not entry_id:
        # If no entry_id provided and not creating entry, create a temporary entry
        entry = Entry(
            user_id=current_user.id,
            text_content=transcription,
            story_style=story_style,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        entry_id = entry.id

    # Save to database
    audio_file = AudioFile(
        user_id=current_user.id,
        entry_id=entry_id,
        filename=file.filename,
        file_path=file_path,
        transcription=transcription,
        duration=0,  # Could be calculated from audio file
    )

    db.add(audio_file)
    db.commit()
    db.refresh(audio_file)

    return UploadResponse(
        success=True,
        message="Audio uploaded and transcribed successfully",
        file_id=audio_file.id,
        filename=file.filename,
        transcription=transcription,
    )


@router.put("/entries/{entry_id}/text", response_model=EntryModel)
async def update_entry_text(
    entry_id: int,
    text_content: str = Query(..., description="The text content to update"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update entry text content"""
    entry = (
        db.query(Entry)
        .filter(Entry.id == entry_id, Entry.user_id == current_user.id)
        .first()
    )

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found"
        )

    entry.text_content = text_content
    db.commit()
    db.refresh(entry)

    return entry


# Image upload
@router.post("/upload/image", response_model=UploadResponse)
async def upload_image(
    files: List[UploadFile] = File(...),
    description: Optional[str] = Form(None),
    entry_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Upload multiple image files"""

    image_ids = []
    for file in files:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File '{file.filename}' must be an image file",
            )

        # Create unique filename
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"

        # Save file
        upload_dir = os.getenv("UPLOAD_DIR", "./uploads")
        image_dir = os.path.join(upload_dir, "images")
        
        # Create directories if they don't exist
        os.makedirs(image_dir, exist_ok=True)
        
        file_path = os.path.join(image_dir, unique_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Save to database
        image = Image(
            user_id=current_user.id,
            entry_id=entry_id,
            filename=file.filename,
            file_path=file_path,
            description=description,
        )

        db.add(image)
        db.commit()
        db.refresh(image)
        image_ids.append(image.id)

    return UploadResponse(
        success=True,
        message="Images uploaded successfully",
        file_ids=image_ids,
    )


# Story generation
@router.post("/generate-story", response_model=StoryGenerationResponse)
async def generate_story(
    request: StoryGenerationRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Generate AI story for an entry"""

    # Get entry
    entry = (
        db.query(Entry)
        .filter(Entry.id == request.entry_id, Entry.user_id == current_user.id)
        .first()
    )

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found"
        )

    # Get related audio and images
    audio_files = (
        db.query(AudioFile)
        .filter(
            AudioFile.user_id == current_user.id,
            AudioFile.created_at >= entry.date.replace(hour=0, minute=0, second=0),
            AudioFile.created_at < entry.date.replace(hour=23, minute=59, second=59),
        )
        .all()
    )

    images = (
        db.query(Image)
        .filter(
            Image.user_id == current_user.id,
            Image.created_at >= entry.date.replace(hour=0, minute=0, second=0),
            Image.created_at < entry.date.replace(hour=23, minute=59, second=59),
        )
        .all()
    )

    # Prepare content for story generation
    audio_transcriptions = [af.transcription for af in audio_files if af.transcription]
    image_descriptions = [img.description for img in images if img.description]

    # Generate story
    story = await ai_service.generate_story(
        text_content=entry.text_content or "",
        audio_transcriptions=audio_transcriptions,
        image_descriptions=image_descriptions,
        style=request.style,
    )

    if not story:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate story",
        )

    # Generate illustration
    illustration_url = await ai_service.generate_illustration(story, request.style)

    # Update entry with generated story
    entry.ai_generated_story = story
    entry.story_style = request.style
    db.commit()

    return StoryGenerationResponse(
        story=story, illustration_url=illustration_url, style=request.style
    )


# Timeline routes
@router.get("/timeline", response_model=TimelineResponse)
async def get_timeline(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    """Get user's timeline with entries, audio, and images"""

    # Parse dates
    if start_date:
        start_date = datetime.fromisoformat(start_date)
    else:
        start_date = datetime.now() - timedelta(days=30)

    if end_date:
        end_date = datetime.fromisoformat(end_date)
    else:
        end_date = datetime.now()

    # Get entries in date range
    entries = (
        db.query(Entry)
        .filter(
            Entry.user_id == current_user.id,
            Entry.date >= start_date,
            Entry.date <= end_date,
        )
        .order_by(Entry.date.desc())
        .all()
    )

    # Get audio and images in date range
    audio_files = (
        db.query(AudioFile)
        .filter(
            AudioFile.user_id == current_user.id,
            AudioFile.created_at >= start_date,
            AudioFile.created_at <= end_date,
        )
        .all()
    )

    images = (
        db.query(Image)
        .filter(
            Image.user_id == current_user.id,
            Image.created_at >= start_date,
            Image.created_at <= end_date,
        )
        .all()
    )

    # Group by date
    timeline_entries = []
    for entry in entries:
        entry_date = entry.date.date()

        # Get audio and images for this date
        day_audio = [af for af in audio_files if af.created_at.date() == entry_date]
        day_images = [img for img in images if img.created_at.date() == entry_date]

        timeline_entries.append(
            {
                "date": entry.date,
                "entry": entry,
                "audio_files": day_audio,
                "images": day_images,
                "has_content": True,
            }
        )

    return TimelineResponse(
        entries=timeline_entries, total_entries=len(timeline_entries)
    )


# Weekly/Monthly recap routes
@router.get("/recap/weekly")
async def get_weekly_recap(
    current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)
):
    """Get weekly recap"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)

    entries = (
        db.query(Entry)
        .filter(
            Entry.user_id == current_user.id,
            Entry.date >= start_date,
            Entry.date <= end_date,
        )
        .all()
    )

    # Convert to dict for AI service
    entries_data = [
        {"date": entry.date.strftime("%Y-%m-%d"), "text_content": entry.text_content}
        for entry in entries
    ]

    recap = await ai_service.generate_weekly_recap(entries_data)

    return {"recap": recap, "period": "weekly"}


@router.get("/recap/monthly")
async def get_monthly_recap(
    current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)
):
    """Get monthly recap"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)

    entries = (
        db.query(Entry)
        .filter(
            Entry.user_id == current_user.id,
            Entry.date >= start_date,
            Entry.date <= end_date,
        )
        .all()
    )

    # Convert to dict for AI service
    entries_data = [
        {"date": entry.date.strftime("%Y-%m-%d"), "text_content": entry.text_content}
        for entry in entries
    ]

    recap = await ai_service.generate_monthly_recap(entries_data)

    return {"recap": recap, "period": "monthly"}


# Narrative generation
@router.post("/narrate", response_model=NarrativeResponse)
async def generate_narrative(
    request: NarrativeRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Generate a narrative from timeline entries"""
    
    if not request.entries:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="No entries provided for narrative generation"
        )

    try:
        # Generate narrative using AI service
        narrative = await ai_service.generate_narrative(request.entries)
        
        # Save narrative to database
        narrative_record = Narrative(
            user_id=current_user.id,
            start_date=datetime.fromisoformat(request.start_date),
            end_date=datetime.fromisoformat(request.end_date),
            narrative_text=narrative
        )
        db.add(narrative_record)
        db.commit()
        db.refresh(narrative_record)
        
        return NarrativeResponse(
            narrative=narrative,
            period=f"{request.start_date} to {request.end_date}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate narrative: {str(e)}"
        )


@router.post("/narrate/audio")
async def generate_narrative_audio(
    request: AudioRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Generate audio from narrative text"""
    
    if not request.text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="No text provided for audio generation"
        )

    try:
        print(f"Generating audio for text length: {len(request.text)}")
        
        # Generate audio using AI service
        audio_data = await ai_service.generate_speech(request.text)
        
        if not audio_data:
            print("No audio data returned from AI service")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate audio - no data returned from AI service"
            )
        
        print(f"Audio data generated successfully, size: {len(audio_data)} bytes")
        
        return Response(
            content=audio_data,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "attachment; filename=narrative.mp3"}
        )
    except Exception as e:
        print(f"Audio generation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate audio: {str(e)}"
        )


@router.post("/narrate/image", response_model=ImageResponse)
async def generate_narrative_image(
    request: ImageRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Generate image from narrative text"""
    
    if not request.text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="No text provided for image generation"
        )

    try:
        print(f"Generating image for text length: {len(request.text)}")
        
        # Generate image using AI service
        image_url = await ai_service.generate_narrative_image(request.text)
        
        if not image_url:
            print("No image URL returned from AI service")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate image - no URL returned from AI service"
            )
        
        print(f"Image generated successfully: {image_url}")
        
        return ImageResponse(image_url=image_url)
    except Exception as e:
        print(f"Image generation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate image: {str(e)}"
        )


@router.put("/narrate/{narrative_id}/audio")
async def update_narrative_audio(
    narrative_id: int,
    audio_url: str = Query(..., description="The audio URL to save"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update narrative with audio URL"""
    
    narrative = (
        db.query(Narrative)
        .filter(Narrative.id == narrative_id, Narrative.user_id == current_user.id)
        .first()
    )
    
    if not narrative:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Narrative not found"
        )
    
    narrative.audio_url = audio_url
    db.commit()
    db.refresh(narrative)
    
    return {"success": True, "message": "Audio URL updated successfully"}


@router.put("/narrate/{narrative_id}/image")
async def update_narrative_image(
    narrative_id: int,
    image_url: str = Query(..., description="The image URL to save"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update narrative with image URL"""
    
    narrative = (
        db.query(Narrative)
        .filter(Narrative.id == narrative_id, Narrative.user_id == current_user.id)
        .first()
    )
    
    if not narrative:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Narrative not found"
        )
    
    narrative.image_url = image_url
    db.commit()
    db.refresh(narrative)
    
    return {"success": True, "message": "Image URL updated successfully"}


@router.get("/narrate/history", response_model=NarrativeHistoryResponse)
async def get_narrative_history(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 3,
):
    """Get user's narrative history"""
    
    # Get total count
    total_count = db.query(Narrative).filter(Narrative.user_id == current_user.id).count()
    
    # Get narratives with pagination
    narratives = (
        db.query(Narrative)
        .filter(Narrative.user_id == current_user.id)
        .order_by(Narrative.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    return NarrativeHistoryResponse(
        narratives=narratives,
        total_count=total_count
    )


# File serving routes
@router.get("/files/audio/{filename}")
async def serve_audio_file(
    filename: str, current_user: User = Depends(get_current_active_user)
):
    """Serve audio file"""
    upload_dir = os.getenv("UPLOAD_DIR", "./uploads")
    file_path = os.path.join(upload_dir, "audio", filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return {"file_path": file_path}


@router.get("/audio/{audio_id}")
async def get_audio_file(
    audio_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get audio file details"""
    audio_file = (
        db.query(AudioFile)
        .filter(AudioFile.id == audio_id, AudioFile.user_id == current_user.id)
        .first()
    )
    
    if not audio_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Audio file not found"
        )
    
    return {
        "id": audio_file.id,
        "filename": audio_file.filename,
        "transcription": audio_file.transcription,
        "entry_id": audio_file.entry_id,
        "created_at": audio_file.created_at
    }


@router.get("/files/image/{filename}")
async def serve_image_file(
    filename: str, current_user: User = Depends(get_current_active_user)
):
    """Serve image file"""
    upload_dir = os.getenv("UPLOAD_DIR", "./uploads")
    file_path = os.path.join(upload_dir, "images", filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return {"file_path": file_path}
