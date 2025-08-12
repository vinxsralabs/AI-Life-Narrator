# AI Life Narrator 🌙✨

A full-stack AI-powered life storytelling application that transforms your daily experiences into beautiful narratives with rich media support.

## Features

- **🔐 Secure Authentication** - Email/password login with logout functionality
- **🎤 Voice Capture & Transcription** - Record and transcribe audio using OpenAI Whisper
- **📸 Rich Media Support** - Upload images and audio with automatic association to entries
- **📝 Text & Voice Entries** - Create diary entries with text, audio, or both
- **🤖 AI Story Generation** - GPT-4o powered narrative creation with custom illustrations
- **🌙 Dynamic Night World UI** - Immersive dark diary theme with animated elements
- **📅 Enhanced Timeline** - Browse your life stories with media thumbnails and click-to-expand
- **🏠 Smart Home Dashboard** - Recent entries with media previews and content management
- **🎨 Media Gallery** - View images in full-screen modal with navigation
- **📊 Weekly/Monthly Recaps** - Auto-generated summaries with narration
- **🔍 Memory Search** - AI-powered query system to search through your life stories
- **💭 Therapy Mode** - AI-assisted reflection and conversation about your experiences

## Tech Stack

- **Frontend**: ReactJS with TypeScript, Framer Motion animations
- **Backend**: Python FastAPI with async support
- **Database**: Local SQLite with automatic initialization
- **AI Services**: OpenAI Whisper (transcription), GPT-4o (story generation), DALL-E (illustrations)
- **UI**: Custom night world theme with glassmorphism effects and responsive design
- **Media Handling**: Local file storage with optimized serving

## Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- OpenAI API key

### Setup

1. **Clone and install dependencies:**
   ```bash
   # Backend setup
   cd backend
   pip install -r requirements.txt
   
   # Frontend setup
   cd ../frontend
   npm install
   ```

2. **Configure environment:**
   ```bash
   # Copy and edit the environment file
   cp backend/.env.example backend/.env
   # Add your OpenAI API key to .env
   ```

3. **Run the application:**
   ```bash
   # Terminal 1: Start backend
   cd backend
   python main.py
   
   # Terminal 2: Start frontend
   cd frontend
   npm start
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## Database

The application automatically creates and initializes a local SQLite database (`life_narrator.db`) on first run. No manual database setup required!

## API Documentation

Once the backend is running, visit http://localhost:8000/docs for interactive API documentation.

## Features in Detail

### Authentication & User Management
- Secure user registration and login with JWT tokens
- User profile management and session handling
- Logout functionality accessible from all pages

### Voice & Media Capture
- Browser-based audio recording with real-time transcription
- Image upload with drag-and-drop support and preview
- Text note creation with character limits and validation
- All media stored locally with optimized serving

### AI Story Generation
- Automatic daily story compilation from multiple sources
- Multiple narrative styles (story, comic, poetic)
- Custom illustrations generated for each entry
- Contextual story generation based on user's day and media

### Enhanced Timeline & Navigation
- Interactive timeline with media thumbnails
- Click-to-expand images in full-screen modal
- Smart content grouping by date and type
- Media indicators (camera/mic icons) with counts
- Support for standalone media entries

### Smart Home Dashboard
- Recent entries section showing last 5 posts
- Media previews with thumbnails and indicators
- Content filtering (text, images, audio, or combinations)
- Quick access to create new entries
- Statistics and activity overview

### Night World UI/UX
- Dynamic animated background (stars, moon, clouds)
- Glassmorphism card effects with hover states
- Smooth transitions and parallax effects
- Responsive design for all devices
- Dark theme optimized for extended use

### Memory Search & AI Therapy
- Natural language queries through your life stories
- AI-powered conversation and reflection
- Contextual responses based on your experiences
- Therapeutic dialogue and insights

## Environment Variables

Create a `.env` file in the backend directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
SECRET_KEY=your_secret_key_here
DATABASE_URL=sqlite:///./life_narrator.db
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

## Recent Updates

### Enhanced Media Support
- **Image Display**: Real thumbnails in timeline and dashboard
- **Click-to-Expand**: Full-screen image viewing with modal
- **Media Association**: Smart linking of images/audio to entries
- **Content Types**: Support for text-only, media-only, and mixed entries

### Improved User Experience
- **Dashboard**: Rich home page with media previews
- **Timeline**: Enhanced browsing with media indicators
- **Navigation**: Streamlined content creation and viewing
- **Responsiveness**: Better mobile and tablet support

### Content Management
- **Entry Types**: Flexible content creation (text, audio, images, combinations)
- **Media Organization**: Automatic grouping and association
- **Content Discovery**: Easy browsing through different content types
- **Smart Filtering**: Show relevant content based on user preferences

## Contributing

This is a complete, production-ready application with active development. Feel free to extend it with additional features!

## License

MIT License - feel free to use and modify as needed. 