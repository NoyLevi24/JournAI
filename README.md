# JournAI - AI-Powered Travel Planner

> Your intelligent companion for crafting unforgettable travel experiences

JournAI is a full-stack travel planning application that uses AI (Gemini/OpenAI) to create personalized itineraries. The application is deployed on AWS using EKS, RDS, and S3 for a scalable and reliable infrastructure with GitOps automation.

## ✨ Features

- 🤖 **AI-Powered Itineraries** - Gemini AI generates personalized travel plans
- 💬 **AI Chatbot** - Edit your itinerary with natural language
- 📸 **Photo Albums** - Organize trip memories by album with S3 storage
- 👤 **User Profiles** - Secure authentication with avatars
- 🗄️ **PostgreSQL** - Production-ready database with AWS RDS
- ☸️ **Kubernetes Ready** - Helm charts for easy deployment
- 🔒 **Secure** - Non-root containers, secrets management
- 🚀 **GitOps** - Automated deployments with ArgoCD
- 🔐 **AWS Secrets Manager** - Secure secrets storage and management

## 🚀 Quick Start

## 🏗️ Infrastructure

JournAI uses the following AWS services:
- **Amazon EKS** for container orchestration
- **Amazon RDS** for PostgreSQL database
- **Amazon S3** for file storage
- **AWS Secrets Manager** for secure secrets storage
- **AWS IAM** for access management
- **AWS ACM** for SSL/TLS certificate management
- **Amazon Route 53** for DNS and domain management
- **GitOps** with ArgoCD for automated deployments

### Local Development

```bash
# Using Docker Compose
cd JournAI-App
docker compose up -d
open http://localhost:8080
```

### 🚀 Domain & SSL Configuration

- **Custom Domain**: `journai.site`
- **SSL/TLS**: Managed by AWS Certificate Manager (ACM)
- **DNS**: Managed through Amazon Route 53
- **HTTPS**: Automatic SSL certificate provisioning and renewal

### AWS Deployment with Terraform & GitOps

1. **Initialize and apply Terraform configuration**
clone from repository: https://github.com/NoyLevi24/Terraform.git
   ```bash
   cd terraform/infrastructure/<logical component(networking, storage+s3, eks)>
   terraform init
   terraform plan
   terraform apply
   ```

2. **Deploy to EKS with GitOps**
   ```bash
   # Configure kubectl
   aws eks --region $(terraform output -raw region) update-kubeconfig \
     --name $(terraform output -raw cluster_name)
   
   # Deploy with Helm 
   cd ../JournAI-Chart
   helm upgrade --install journai . -n journai
   
   # Deploy with ArgoCD 
   # See https://github.com/NoyLevi24/GitOps.git repository for ArgoCD configuration
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
└── README.md             # Project overview
    
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
- **AWS Secrets Manager** - Secure secrets storage and rotation
- **Terraform** - Infrastructure as Code
- **Helm** - Kubernetes package manager
- **ArgoCD** - GitOps continuous delivery
- **Docker** - Containerization

## 📚 Documentation

- **[Application README](./JournAI-App/README.md)** - How to run the code
- **[Helm Chart README](./JournAI-Chart/README.md)** - Kubernetes deployment
- **[GitOps Repository](https://github.com/NoyLevi24/GitOps.git)** - ArgoCD configuration
- **[Terraform Repository](https://github.com/NoyLevi24/Terraform.git)** - AWS infrastructure


## 🔧 Configuration

### Prerequisites

1. **AWS Account** with appropriate IAM permissions
2. **AWS CLI** configured with access keys
3. **kubectl** and **helm** installed
4. **Terraform** (v1.0+)

### AWS Secrets Manager Integration

JournAI uses AWS Secrets Manager for secure storage of all sensitive data:

- **Database credentials** (RDS username/password)
- **API keys** (Gemini, OpenAI)
- **JWT secrets**
- **AWS access keys**
- **Application secrets**

Secrets are automatically injected into Kubernetes pods using the Secrets Store CSI Driver, eliminating the need for manual secret management.

### Required AWS IAM Permissions

The IAM role/user needs permissions for:
- Secrets Manager (read/write secrets)
- EKS (cluster management)
- RDS (database access)
- S3 (file storage)
- IAM (role management)

## 🌐 Production Deployment

JournAI is production-ready with:
- ✅ Kubernetes Helm charts
- ✅ PostgreSQL support
- ✅ AWS RDS ready
- ✅ AWS Secrets Manager integration
- ✅ Automatic secret injection
- ✅ Non-root containers
- ✅ Persistent storage
- ✅ Load balancing
- ✅ GitOps automation with ArgoCD
- ✅ Multi-environment support (dev/staging/prod)

See [Deployment Guide](./docs/DEPLOYMENT.md) for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 Version History

- **v2.2** - AWS Secrets Manager integration, automatic secret injection
- **v2.1** - GitOps automation, ArgoCD integration, multi-environment support
- **v2.0** - AWS S3 integration, enhanced security, non-root containers
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
- ArgoCD project
- AWS cloud platform

---

*Start your next adventure with JournAI - where AI meets wanderlust!* ✈️🌍
