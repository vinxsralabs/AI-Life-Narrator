# AI Life Narrator - Setup Guide 🌙✨

This guide will help you set up and run the AI Life Narrator application on your local machine. The application now features enhanced media support, improved timeline navigation, and a rich dashboard experience.

## Prerequisites

Before you begin, make sure you have the following installed:

### Required Software
- **Python 3.8 or higher** - [Download here](https://www.python.org/downloads/)
- **Node.js 16 or higher** - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)

### Required API Keys
- **OpenAI API Key** - [Get one here](https://platform.openai.com/api-keys)

## Quick Start (Recommended)

The easiest way to get started is using our automated setup script:

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd ai-life-narrator
   ```

2. **Run the setup script**:
   ```bash
   python start.py
   ```

3. **Follow the prompts**:
   - Choose option 1 to install dependencies and start the application
   - The script will guide you through the entire process

4. **Add your OpenAI API key**:
   - Edit `backend/.env`
   - Replace `your_openai_api_key_here` with your actual API key

5. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Manual Setup

If you prefer to set up manually or the automated script doesn't work:

### Step 1: Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create a virtual environment** (recommended):
   ```bash
   python -m venv venv
   
   # On Windows:
   venv\Scripts\activate
   
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   ```bash
   # Copy the example file
   cp env.example .env
   
   # Edit .env and add your OpenAI API key
   # Replace: OPENAI_API_KEY=your_openai_api_key_here
   ```

5. **Start the backend server**:
   ```bash
   python main.py
   ```

   The backend will start on http://localhost:8000

### Step 2: Frontend Setup

1. **Open a new terminal and navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Start the frontend development server**:
   ```bash
   npm start
   ```

   The frontend will start on http://localhost:3000

## Database Setup

The application automatically creates and initializes a local SQLite database on first run. No manual database setup is required!

- Database file: `backend/life_narrator.db`
- Upload directory: `backend/uploads/` (with subdirectories for images, audio, and illustrations)

## Demo Account

A demo account is automatically created for testing:

- **Email**: demo@lifenarrator.com
- **Password**: demo123

## Features Overview

### 🔐 Authentication & User Management
- Secure user registration and login with JWT tokens
- User profile management and session handling
- Logout functionality accessible from all pages

### 🎤 Voice Capture & Transcription
- Browser-based audio recording with real-time feedback
- Automatic transcription using OpenAI Whisper
- Audio playback and management with duration tracking
- Support for multiple audio formats

### 📸 Rich Media Support
- Drag-and-drop image upload with preview
- Multiple image formats (JPG, PNG, GIF, WebP)
- Audio file upload and management
- Smart media association with diary entries

### 📝 Content Creation
- Text diary entries with character limits
- Voice-to-text transcription
- Image upload and description
- Combined media and text entries
- Real-time content preview

### 🤖 AI Story Generation
- GPT-4o powered narrative creation
- Multiple story styles (narrative, comic, poetic)
- Custom illustrations generated with DALL-E
- Story regeneration and customization
- Context-aware story generation based on media and text

### 🌙 Enhanced Night World UI/UX
- Dynamic animated background (stars, moon, clouds)
- Glassmorphism card effects with hover states
- Smooth transitions and parallax effects
- Dark theme optimized for extended use
- Responsive design for all devices

### 📅 Enhanced Timeline & Navigation
- Interactive timeline with media thumbnails
- Click-to-expand images in full-screen modal
- Smart content grouping by date and type
- Media indicators (camera/mic icons) with counts
- Support for standalone media entries
- Smooth scrolling and animations

### 🏠 Smart Home Dashboard
- Recent entries section showing last 5 posts
- Media previews with thumbnails and indicators
- Content filtering (text, images, audio, or combinations)
- Quick access to create new entries
- Statistics and activity overview
- Real-time content updates

### 🎨 Media Gallery & Management
- Full-screen image viewing with modal
- Image navigation and zoom support
- Media organization by entry and date
- Thumbnail generation and optimization
- Error handling for corrupted media files

### 🔍 Memory Search & AI Therapy
- Natural language queries through your life stories
- AI-powered conversation and reflection
- Contextual responses based on your experiences
- Therapeutic dialogue and insights
- Search history and query management

## API Endpoints

Once the backend is running, you can explore the API at http://localhost:8000/docs

### Key Endpoints:
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/upload/audio` - Audio upload and transcription
- `POST /api/upload/image` - Image upload with entry association
- `POST /api/entries` - Create diary entry
- `POST /api/generate-story` - Generate AI story
- `GET /api/timeline` - Get user timeline with media
- `GET /api/recap/weekly` - Weekly recap
- `GET /api/recap/monthly` - Monthly recap
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/entries` - Get user entries with pagination

### Media Serving:
- `GET /uploads/images/{filename}` - Serve image files
- `GET /uploads/audio/{filename}` - Serve audio files
- `GET /uploads/illustrations/{filename}` - Serve AI-generated illustrations

## Troubleshooting

### Common Issues

1. **Port already in use**:
   - Backend: Change port in `backend/main.py`
   - Frontend: Change port in `frontend/package.json`

2. **OpenAI API errors**:
   - Check your API key in `backend/.env`
   - Ensure you have sufficient credits
   - Verify the API key has the required permissions

3. **Database errors**:
   - Delete `backend/life_narrator.db` and restart
   - Check file permissions in the backend directory
   - Ensure the uploads directory exists and is writable

4. **Audio recording issues**:
   - Ensure microphone permissions are granted
   - Try a different browser (Chrome recommended)
   - Check if HTTPS is required for your setup
   - Verify Web Audio API support

5. **Image upload issues**:
   - Check file size limits (default: 10MB)
   - Verify supported formats: JPG, PNG, GIF, WebP
   - Ensure upload directory permissions
   - Check for sufficient disk space

6. **Media display issues**:
   - Verify image files exist in uploads directory
   - Check browser console for CORS errors
   - Ensure backend is serving static files correctly
   - Clear browser cache if images don't update

7. **Timeline not showing media**:
   - Check if images have proper entry_id association
   - Verify timeline API is returning media data
   - Check browser network tab for API errors
   - Ensure media files are accessible

### Performance Tips

1. **For better performance**:
   - Use Chrome or Firefox (latest versions)
   - Ensure stable internet connection for AI features
   - Close unnecessary browser tabs
   - Use SSD storage for faster file access

2. **For development**:
   - Use the development servers (they auto-reload)
   - Check browser console for frontend errors
   - Monitor backend logs for API issues
   - Use browser dev tools for media debugging

3. **For media handling**:
   - Optimize image sizes before upload
   - Use appropriate audio formats (WebM recommended)
   - Monitor upload directory size
   - Regular cleanup of unused media files

## Environment Variables

Key environment variables in `backend/.env`:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Security
SECRET_KEY=your_secret_key_here_change_this_in_production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database
DATABASE_URL=sqlite:///./life_narrator.db

# Application Settings
CORS_ORIGINS=["http://localhost:3000"]
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB

# Media Settings
SUPPORTED_IMAGE_FORMATS=["image/jpeg", "image/png", "image/gif", "image/webp"]
SUPPORTED_AUDIO_FORMATS=["audio/webm", "audio/mp3", "audio/wav", "audio/ogg"]
```

## File Structure

```
ai-life-narrator/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main application with media serving
│   ├── database.py         # Database models and setup
│   ├── auth.py             # Authentication logic
│   ├── ai_service.py       # OpenAI integration
│   ├── routes.py           # API endpoints with media support
│   ├── models.py           # Pydantic models for enhanced entries
│   ├── timezone_utils.py   # Timezone handling utilities
│   ├── requirements.txt    # Python dependencies
│   ├── env.example         # Environment template
│   └── uploads/            # File uploads directory
│       ├── images/         # User uploaded images
│       ├── audio/          # User uploaded audio files
│       └── illustrations/  # AI-generated illustrations
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components with media support
│   │   ├── pages/          # Page components (Dashboard, Timeline, etc.)
│   │   ├── contexts/       # React contexts (Auth, Theme)
│   │   ├── ui/             # UI components (Cards, Buttons, Modals)
│   │   ├── utils/          # Utility functions and timezone handling
│   │   ├── App.tsx         # Main app component
│   │   └── index.tsx       # Entry point
│   ├── public/             # Static files
│   └── package.json        # Node.js dependencies
├── start.py                # Automated setup script
├── README.md               # Project overview
├── SETUP.md               # This file
└── .gitignore             # Git ignore rules
```

## Recent Updates & New Features

### Enhanced Media Support
- **Real Image Thumbnails**: Timeline and dashboard now show actual image previews
- **Click-to-Expand**: Full-screen image viewing with modal interface
- **Media Association**: Smart linking of images/audio to diary entries
- **Content Types**: Support for text-only, media-only, and mixed entries

### Improved User Experience
- **Rich Dashboard**: Home page with media previews and recent entries
- **Enhanced Timeline**: Better browsing with media indicators and thumbnails
- **Streamlined Navigation**: Improved content creation and viewing workflows
- **Mobile Optimization**: Better responsive design for all devices

### Content Management
- **Flexible Entries**: Create content with any combination of text, audio, and images
- **Smart Organization**: Automatic grouping and association of related content
- **Content Discovery**: Easy browsing through different content types
- **Media Indicators**: Clear visual cues for different content types

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the browser console for frontend errors
3. Check the backend terminal for API errors
4. Ensure all dependencies are properly installed
5. Verify your OpenAI API key is valid and has credits
6. Check file permissions and disk space
7. Review the API documentation at http://localhost:8000/docs

## Contributing

This is a complete, production-ready application with active development. Feel free to:

- Report bugs or issues
- Suggest new features
- Submit pull requests
- Fork and modify for your own projects
- Contribute to media handling improvements
- Add new AI features or integrations

## License

MIT License - feel free to use and modify as needed.

---

**Happy storytelling with rich media! 🌙✨📸🎤** 