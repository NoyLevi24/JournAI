# JournAI Application

> **Application Code** - Backend (Node.js) + Frontend (React)
> 
> For general project information, see [main README](../README.md)

## Latest Updates (v2.0)

- ✅ **AWS S3 Integration** - Secure file storage for uploads
- ✅ **AWS RDS PostgreSQL** - Managed database service
- ✅ **AWS EKS Deployment** - Kubernetes orchestration
- ✅ **Terraform Infrastructure** - Infrastructure as Code
- ✅ **GitOps Workflow** - Automated deployments with ArgoCD
- ✅ **Non-root Containers** - Enhanced security

## 🚀 Quick Start

### Local Development

```bash
# Using Docker Compose (Easiest)
docker compose up -d

# Access the app
open http://localhost:8080
```

### Production Deployment

For production deployment on AWS EKS, see the [Helm Chart](../JournAI-Chart/) and [Infrastructure Repository](https://github.com/your-org/journai-terraform).

### Environment Variables

Create `.env` file in the backend directory:

```bash
# Database
DB_CLIENT=postgres
DB_HOST=your-rds-endpoint
DB_PORT=5432
DB_NAME=journai
DB_USER=postgres
DB_PASSWORD=your-db-password

# AWS
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=your-region
AWS_S3_BUCKET=your-bucket-name

# JWT
JWT_SECRET=your-jwt-secret

# AI
GEMINI_API_KEY=your-gemini-key
```



## 📁 Project Structure
JournAI/
├── backend/                 # Node.js + Express API server
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── middleware/     # Authentication & validation
│   │   ├── models/         # Database models
│   │   └── services/       # Business logic
│   │       └── s3.service.js  # S3 file upload service
│   ├── .env.example        # Environment variables template
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
git clone https://github.com/NoyLevi24/JournAI.git
cd JournAI

# Install backend dependencies
cd backend
npm install
# Create necessary directories
mkdir -p data uploads

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Environment Configuration

```bash
# Backend environment setup
cd backend
cp env.example .env
```

**⚠️ IMPORTANT:** Edit the `.env` file with your configuration:
```bash
# Open .env file and set:
JWT_SECRET=your_super_secret_jwt_key_here_change_this
GEMINI_API_KEY=your-gemini-api-key  # Get from https://ai.google.dev/ (FREE!)
OPENAI_API_KEY=  # Optional fallback
PORT=3000
DB_CLIENT=postgres  # or sqlite for development
```

**🔑 JWT_SECRET:** Generate a strong secret key (at least 32 characters):
```bash
# Option 1: Use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Use online generator or create your own
# Example: my_super_secret_jwt_key_2024_journai_secure_12345
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
# Frontend runs on http://localhost:8080 (or next available port)
```

### Step 4: Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000/api

### Assets Setup
Ensure these files are in `frontend/public/`:
- `logo.png` - JournAI logo
- `background.jpg` - Homepage background image
- `rome.jpg` - Rome cultural tour example image
- `Swiss-Alps.jpg` - Swiss Alps nature adventure example image
- `Bali.jpg` - Bali tropical paradise example image

### Production Deployment

#### Option 1: Simple Production (npm)

```bash
# Build frontend
cd frontend
npm run build

# Start production server
cd ../backend
npm start
```

#### Option 2: Docker Compose (Recommended for Production)

```bash
# Run with Docker Compose (builds images if needed)
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

**Docker Compose Benefits:**
- **Nginx** serves static files (faster)
- **Isolated containers** for better security
- **Easy scaling** and deployment
- **Production-ready** configuration

**Access:**
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000/api

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
- **PostgreSQL** - Production-ready relational database
- **AWS RDS Ready** - Seamless migration to managed database
- **Automatic SQL conversion** - Supports both SQLite (dev) and PostgreSQL (prod)
- **File storage** - User photos in persistent volumes

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
