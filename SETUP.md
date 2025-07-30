# AI Life Narrator - Setup Guide 🌙✨

This guide will help you set up and run the AI Life Narrator application on your local machine.

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
- Upload directory: `backend/uploads/`

## Demo Account

A demo account is automatically created for testing:

- **Email**: demo@lifenarrator.com
- **Password**: demo123

## Features Overview

### 🔐 Authentication
- Secure user registration and login
- JWT token-based authentication
- Logout functionality accessible from all pages

### 🎤 Voice Capture
- Browser-based audio recording
- Automatic transcription using OpenAI Whisper
- Audio playback and management

### 📸 Photo & Text Upload
- Drag-and-drop image upload
- Text diary entries
- Multiple file format support

### 🤖 AI Story Generation
- GPT-4o powered narrative creation
- Multiple story styles (narrative, comic, poetic)
- Custom illustrations with DALL-E
- Story regeneration capability

### 🌙 Night World UI/UX
- Dynamic animated background (stars, moon, clouds)
- Glassmorphism card effects
- Smooth transitions and parallax effects
- Dark/light mode toggle

### 📅 Timeline & Navigation
- Interactive timeline view
- Calendar navigation
- Story browsing and exploration
- Media gallery integration

## API Endpoints

Once the backend is running, you can explore the API at http://localhost:8000/docs

### Key Endpoints:
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/upload/audio` - Audio upload and transcription
- `POST /api/upload/image` - Image upload
- `POST /api/entries` - Create diary entry
- `POST /api/generate-story` - Generate AI story
- `GET /api/timeline` - Get user timeline
- `GET /api/recap/weekly` - Weekly recap
- `GET /api/recap/monthly` - Monthly recap

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

4. **Audio recording issues**:
   - Ensure microphone permissions are granted
   - Try a different browser (Chrome recommended)
   - Check if HTTPS is required for your setup

5. **Image upload issues**:
   - Check file size limits (default: 10MB)
   - Verify supported formats: JPG, PNG, GIF, WebP
   - Ensure upload directory permissions

### Performance Tips

1. **For better performance**:
   - Use Chrome or Firefox
   - Ensure stable internet connection for AI features
   - Close unnecessary browser tabs

2. **For development**:
   - Use the development servers (they auto-reload)
   - Check browser console for errors
   - Monitor backend logs for API issues

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
```

## File Structure

```
ai-life-narrator/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main application
│   ├── database.py         # Database models and setup
│   ├── auth.py             # Authentication logic
│   ├── ai_service.py       # OpenAI integration
│   ├── routes.py           # API endpoints
│   ├── models.py           # Pydantic models
│   ├── requirements.txt    # Python dependencies
│   ├── env.example         # Environment template
│   └── uploads/            # File uploads directory
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── App.tsx         # Main app component
│   │   └── index.tsx       # Entry point
│   ├── public/             # Static files
│   └── package.json        # Node.js dependencies
├── start.py                # Automated setup script
├── README.md               # Project overview
├── SETUP.md               # This file
└── .gitignore             # Git ignore rules
```

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the browser console for frontend errors
3. Check the backend terminal for API errors
4. Ensure all dependencies are properly installed
5. Verify your OpenAI API key is valid and has credits

## Contributing

This is a complete, production-ready application. Feel free to:

- Report bugs or issues
- Suggest new features
- Submit pull requests
- Fork and modify for your own projects

## License

MIT License - feel free to use and modify as needed.

---

**Happy storytelling! 🌙✨** 