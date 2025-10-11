# JournAI - AI-Powered Travel Planner

> Your intelligent companion for crafting unforgettable travel experiences

JournAI is a full-stack travel planning application that uses AI (Gemini/OpenAI) to create personalized itineraries tailored to your interests, budget, and travel style.

## ✨ Features

- 🤖 **AI-Powered Itineraries** - Gemini AI generates personalized travel plans
- 💬 **AI Chatbot** - Edit your itinerary with natural language
- 📸 **Photo Albums** - Organize trip memories by album
- 👤 **User Profiles** - Secure authentication with avatars
- 🗄️ **PostgreSQL** - Production-ready database
- ☸️ **Kubernetes Ready** - Helm charts for easy deployment
- 🔒 **Secure** - Non-root containers, secrets management

## 🚀 Quick Start

### Local Development

```bash
# Using Docker Compose
cd JournAI-App
docker compose up -d
open http://localhost:5173
```

### Kubernetes Deployment

```bash
# Using Helm
cd JournAI-Chart
cp values-secrets.yaml.example values-secrets.yaml
# Edit values-secrets.yaml with your secrets
helm install journai . -n journai -f values-secrets.yaml
```

## 📁 Project Structure

```
JournAI/
├── JournAI-App/          # Application code (React + Node.js)
│   ├── backend/          # Express API server
│   ├── frontend/         # React TypeScript SPA
│   └── README.md         # Development guide
├── JournAI-Chart/        # Kubernetes Helm chart
│   ├── templates/        # K8s manifests
│   ├── values.yaml       # Configuration
│   └── README.md         # Deployment guide
└── docs/                 # Documentation
    ├── DEPLOYMENT.md     # Production deployment
    └── RDS-MIGRATION.md  # AWS RDS migration
```

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- CSS-in-JS with glass morphism

### Backend
- Node.js + Express
- PostgreSQL
- JWT Authentication
- Multer (file uploads)

### AI
- Google Gemini (primary, free!)
- OpenAI (fallback)

### Infrastructure
- Docker & Docker Compose
- Kubernetes + Helm
- AWS ready (EKS, RDS, S3)

## 📚 Documentation

- **[Application README](./JournAI-App/README.md)** - How to run the code
- **[Helm Chart README](./JournAI-Chart/README.md)** - Kubernetes deployment
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Production setup
- **[RDS Migration](./docs/RDS-MIGRATION.md)** - Database migration

## 🔧 Configuration

### Get API Keys

1. **Gemini API** (Free!): https://ai.google.dev/
2. **OpenAI API** (Optional): https://platform.openai.com/

### Environment Variables

```bash
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-gemini-key
DB_CLIENT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=journai
DB_USER=journai
DB_PASSWORD=your-password
```

## 🌐 Production Deployment

JournAI is production-ready with:
- ✅ Kubernetes Helm charts
- ✅ PostgreSQL support
- ✅ AWS RDS ready
- ✅ Secure secrets management
- ✅ Non-root containers
- ✅ Persistent storage
- ✅ Load balancing

See [Deployment Guide](./docs/DEPLOYMENT.md) for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 Version History

- **v1.4** - Gemini AI, Kubernetes, ConfigMap/Secrets
- **v1.3** - PostgreSQL support, RDS ready
- **v1.2** - Photo albums, AI chatbot
- **v1.1** - User profiles, authentication
- **v1.0** - Initial release

## 👩‍💻 Author

Noy & Shir Levi

## 🙏 Acknowledgments

- Google Gemini AI
- OpenAI
- React & Vite teams
- Kubernetes & Helm communities

---

*Start your next adventure with JournAI - where AI meets wanderlust!* ✈️🌍
