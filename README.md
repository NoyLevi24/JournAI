# JournAI - Smart Trip Planner

JournAI is an AI-powered travel planning application that creates personalized itineraries tailored to your interests, budget, and travel style. From hidden gems to must-see attractions, JournAI crafts unforgettable travel experiences.



## 📁 Project Structure

```
JournAI/
├── backend/                 # Node.js + Express API server
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── middleware/     # Authentication & validation
│   │   └── models/         # Database models
│   ├── uploads/            # User uploaded photos
│   ├── env.example         # Environment variables template
│   └── package.json
├── frontend/               # React + TypeScript frontend
│   ├── src/
│   │   ├── App.tsx         # Main application component
│   │   └── main.tsx        # Entry point
│   ├── public/             # Static assets
│   │   ├── logo.png
│   │   ├── background.jpg
│   │   ├── rome.jpg
│   │   ├── Swiss-Alps.jpg
│   │   └── Bali.jpg
│   └── package.json
├── docker-compose.yml      # Docker configuration
└── README.md
```

## 🚀 How to Run the Project

### Prerequisites
- **Node.js 18+** 
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)

### Step 1: Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd JournAI

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Environment Configuration

```bash
# Backend environment setup
cd backend
cp env.example .env
# Edit .env file with your configuration:
# JWT_SECRET=your-secret-key
# OPENAI_API_KEY=your-openai-key (optional)
```

### Step 3: Run Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173 (or next available port)
```

### Step 4: Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api

### Assets Setup
Ensure these files are in `frontend/public/`:
- `logo.png` - JournAI logo
- `background.jpg` - Homepage background image
- `rome.jpg` - Rome cultural tour example image
- `Swiss-Alps.jpg` - Swiss Alps nature adventure example image
- `Bali.jpg` - Bali tropical paradise example image

### Production Deployment

```bash
# Build frontend
cd frontend
npm run build

# Start production server
cd ../backend
npm start
```

## 🛠️ Technical Details

### Frontend Technologies
- **React 18 & TypeScript** - For a robust and type-safe user interface.
- **Vite** - Fast build tool and development server
- **CSS-in-JS** - Inline styling with glass morphism effects

### Backend Technologies
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **JWT** - JSON Web Tokens for authentication
- **Multer** - File upload middleware for photos
- **CORS** - Cross-Origin Resource Sharing enabled


### Database
- **SQLite** - Lightweight database for development
- **File-based storage** - User photos stored in uploads directory

### Development Tools
- **Hot Reload** - Automatic page refresh during development
- **TypeScript Compiler** - Real-time type checking
- **ESLint** - Code linting and formatting
- **Vite Dev Server** - Fast development server with HMR

## 🎯 Key Features

- **Personalized Itineraries:** AI-driven trip plans based on user interests.

- **Photo Uploads:** Users can upload and manage photos for their trips.

- **User Authentication:** Secure registration and login using JWT.

- **Responsive Design:** A mobile-first approach with a modern, elegant UI.

---

*Start your next adventure with JournAI - where AI meets wanderlust!*
