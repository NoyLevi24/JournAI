# JournAI - AI-Powered Travel Planner

> Your intelligent companion for crafting unforgettable travel experiences

JournAI is a full-stack travel planning application that uses AI (Gemini/OpenAI) to create personalized itineraries. The application is deployed on AWS using EKS, RDS, and S3 for a scalable and reliable infrastructure.

## ✨ Features

- 🤖 **AI-Powered Itineraries** - Gemini AI generates personalized travel plans
- 💬 **AI Chatbot** - Edit your itinerary with natural language
- 📸 **Photo Albums** - Organize trip memories by album
- 👤 **User Profiles** - Secure authentication with avatars
- 🗄️ **PostgreSQL** - Production-ready database
- ☸️ **Kubernetes Ready** - Helm charts for easy deployment
- 🔒 **Secure** - Non-root containers, secrets management

## 🚀 Quick Start

## 🏗️ Infrastructure

JournAI uses the following AWS services:
- **Amazon EKS** for container orchestration
- **Amazon RDS** for PostgreSQL database
- **Amazon S3** for file storage
- **AWS IAM** for access management

### Local Development

```bash
# Using Docker Compose
cd JournAI-App
docker compose up -d
open http://localhost:5173
```

### AWS Deployment with Terraform

1. **Initialize and apply Terraform configuration**
   ```bash
   cd terraform
   terraform init
   terraform plan
   terraform apply
   ```

2. **Deploy to EKS**
   ```bash
   # Configure kubectl
   aws eks --region $(terraform output -raw region) update-kubeconfig \
     --name $(terraform output -raw cluster_name)
   
   # Deploy with Helm
   cd ../JournAI-Chart
   helm upgrade --install journai . -n journai -f values-secrets.yaml
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
- **AWS EKS** - Managed Kubernetes service
- **AWS RDS** - Managed PostgreSQL database
- **AWS S3** - Object storage for file uploads
- **Terraform** - Infrastructure as Code
- **Helm** - Kubernetes package manager
- **Docker** - Containerization

## 📚 Documentation

- **[Application README](./JournAI-App/README.md)** - How to run the code
- **[Helm Chart README](./JournAI-Chart/README.md)** - Kubernetes deployment
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Production setup
- **[RDS Migration](./docs/RDS-MIGRATION.md)** - Database migration

## 🔧 Configuration

### Prerequisites

1. **AWS Account** with appropriate IAM permissions
2. **AWS CLI** configured with access keys
3. **kubectl** and **helm** installed
4. **Terraform** (v1.0+)

### Required Secrets

1. **AWS Credentials**
   - AWS_ACCESS_KEY_ID
   - AWS_SECRET_ACCESS_KEY
   - AWS_DEFAULT_REGION

2. **Application Secrets** (set in values-secrets.yaml)
   ```yaml
   aws:
     accessKeyId: your-aws-access-key
     secretAccessKey: your-aws-secret-key
     region: your-aws-region
     s3Bucket: your-s3-bucket-name
   
   database:
     host: your-rds-endpoint
     name: journai
     user: postgres
     password: your-db-password
   
   jwtSecret: your-jwt-secret
   geminiApiKey: your-gemini-key
   ```
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
