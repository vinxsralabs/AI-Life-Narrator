# AI Life Narrator 🌙✨

A full-stack AI-powered life storytelling application that transforms your daily experiences into beautiful narratives.

## Features

- **🔐 Secure Authentication** - Email/password login with logout functionality
- **🎤 Voice Capture** - Record and transcribe audio using OpenAI Whisper
- **📸 Photo & Text Upload** - Upload daily images and diary notes
- **🤖 AI Story Generation** - GPT-4o powered narrative creation with custom illustrations
- **🌙 Dynamic Night World UI** - Immersive dark diary theme with animated elements
- **📅 Interactive Timeline** - Browse and explore your life stories
- **🎨 Advanced Visualizations** - Gallery views, story carousels, and media players
- **📊 Weekly/Monthly Recaps** - Auto-generated summaries with narration

## Tech Stack

- **Frontend**: ReactJS with TypeScript
- **Backend**: Python FastAPI
- **Database**: Local SQLite (auto-initialized)
- **AI Services**: OpenAI Whisper, GPT-4o, DALL-E
- **UI**: Custom night world theme with glassmorphism effects

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

### Authentication
- Secure user registration and login
- JWT token-based authentication
- Logout functionality accessible from all pages

### Voice & Media Capture
- Browser-based audio recording
- Image upload with preview
- Text note creation
- All media stored locally

### AI Story Generation
- Automatic daily story compilation
- Multiple narrative styles (story, comic, poetic)
- Custom illustrations for each entry
- Contextual story generation based on user's day

### Night World UI/UX
- Dynamic animated background (stars, moon, clouds)
- Glassmorphism card effects
- Smooth transitions and parallax effects
- Responsive design for all devices

### Timeline & Navigation
- Interactive calendar view
- Scrollable timeline with smooth animations
- Gallery view for media browsing
- Story carousel for narrative exploration

## Environment Variables

Create a `.env` file in the backend directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
SECRET_KEY=your_secret_key_here
DATABASE_URL=sqlite:///./life_narrator.db
```

## Contributing

This is a complete, production-ready application. Feel free to extend it with additional features!

## License

MIT License - feel free to use and modify as needed. 