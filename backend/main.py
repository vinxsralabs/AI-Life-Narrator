from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from dotenv import load_dotenv

from routes import router
from database import init_db, seed_demo_data, get_db

load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="AI Life Narrator API",
    description="A full-stack AI-powered life storytelling application",
    version="1.0.0",
)

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router, prefix="/api")


# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database and seed demo data on startup"""
    print("🚀 Starting AI Life Narrator API...")

    # Initialize database
    init_db()

    # Seed demo data
    db = next(get_db())
    try:
        seed_demo_data(db)
    finally:
        db.close()

    print("✅ API startup complete!")


# Health check endpoint
@app.get("/")
async def root():
    return {"message": "AI Life Narrator API", "version": "1.0.0", "status": "running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Serve static files (uploads)
upload_dir = os.getenv("UPLOAD_DIR", "./uploads")
if os.path.exists(upload_dir):
    app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")


# Serve specific  file types
@app.get("/uploads/audio/{filename}")
async def serve_audio(filename: str):
    file_path = os.path.join(upload_dir, "audio", filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="audio/*")
    raise HTTPException(status_code=404, detail="Audio file not found")


@app.get("/uploads/images/{filename}")
async def serve_image(filename: str):
    file_path = os.path.join(upload_dir, "images", filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="image/*")
    raise HTTPException(status_code=404, detail="Image file not found")


@app.get("/uploads/illustrations/{filename}")
async def serve_illustration(filename: str):
    file_path = os.path.join(upload_dir, "illustrations", filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="image/*")
    raise HTTPException(status_code=404, detail="Illustration file not found")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
