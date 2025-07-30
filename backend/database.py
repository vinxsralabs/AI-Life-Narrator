from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Boolean,
    ForeignKey,
    LargeBinary,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL - defaults to local SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./life_narrator.db")

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args=(
        {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
    ),
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    entries = relationship("Entry", back_populates="user")
    audio_files = relationship("AudioFile", back_populates="user")
    images = relationship("Image", back_populates="user")


class Entry(Base):
    __tablename__ = "entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime, default=datetime.utcnow)
    text_content = Column(Text)
    ai_generated_story = Column(Text)
    story_style = Column(String, default="story")  # story, comic, poetic
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="entries")
    audio_files = relationship("AudioFile", back_populates="entry")
    images = relationship("Image", back_populates="entry")


class AudioFile(Base):
    __tablename__ = "audio_files"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    entry_id = Column(Integer, ForeignKey("entries.id"), nullable=True)
    filename = Column(String)
    file_path = Column(String)
    transcription = Column(Text)
    duration = Column(Integer)  # in seconds
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="audio_files")
    entry = relationship("Entry", back_populates="audio_files")


class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    entry_id = Column(Integer, ForeignKey("entries.id"), nullable=True)
    filename = Column(String)
    file_path = Column(String)
    description = Column(Text)
    ai_generated_illustration = Column(Text)  # URL or path to generated image
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="images")
    entry = relationship("Entry", back_populates="images")


# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Initialize database
def init_db():
    """Initialize the database and create all tables"""
    Base.metadata.create_all(bind=engine)

    # Create uploads directory if it doesn't exist
    upload_dir = os.getenv("UPLOAD_DIR", "./uploads")
    os.makedirs(upload_dir, exist_ok=True)
    os.makedirs(os.path.join(upload_dir, "audio"), exist_ok=True)
    os.makedirs(os.path.join(upload_dir, "images"), exist_ok=True)
    os.makedirs(os.path.join(upload_dir, "illustrations"), exist_ok=True)

    print("✅ Database initialized successfully!")
    print(f"📁 Upload directory created: {upload_dir}")


# Seed demo data
def seed_demo_data(db):
    """Seed the database with demo data for testing"""
    from passlib.context import CryptContext

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    # Check if demo user already exists
    demo_user = db.query(User).filter(User.email == "demo@lifenarrator.com").first()
    if demo_user:
        print("Demo user already exists, skipping seed data.")
        return

    # Create demo user
    demo_user = User(
        email="demo@lifenarrator.com",
        username="demo_user",
        hashed_password=pwd_context.hash("demo123"),
        is_active=True,
    )
    db.add(demo_user)
    db.commit()
    db.refresh(demo_user)

    print("🌱 Demo data seeded successfully!")
    print("Demo user: demo@lifenarrator.com / demo123")
