# JournAI Helm Chart

Kubernetes Helm chart for deploying JournAI on AWS EKS - AI-powered travel planning application with S3 and RDS integration.

## 🚀 Quick Start

### Prerequisites

1. **AWS EKS Cluster** - Deployed using the [Terraform repository](https://github.com/NoyLevi24/Terraform.git)
2. **kubectl** configured to access your EKS cluster
3. **Helm** (v3.0+)

### Installation


# Install with AWS configuration
helm upgrade --install journai . \
  -n journai \
  --create-namespace \
  -f values-secrets.yaml \
  --set aws.region=your-region \
  --set aws.s3.bucket=your-bucket-name \
  --set database.host=your-rds-endpoint \
  --set ingress.host=journai.site \
  --set ingress.tls[0].hosts[0]=journai.site \
  --set ingress.tls[0].secretName=journai-tls
```

### Upgrading

```bash
helm upgrade journai . -n journai 
```

### Uninstalling

```bash
helm uninstall journai -n journai
```

## 📋 Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- PV provisioner support (for persistent storage)

## 🔧 Configuration

### Required: Create Secrets in AWS Secrets Manager

Copy and update with your secrets:

```bash
aws secretsmanager create-secret \
  --name journai/app-secrets \
  --description "JournAI application secrets" \
  --secret-string '{
    "JWT_SECRET": "",
    "GEMINI_API_KEY": "",
    "OPENAI_API_KEY": "",
    "DB_PASSWORD": "",
    "AWS_ACCESS_KEY_ID": "",
    "AWS_SECRET_ACCESS_KEY": ""
  }' \
  --region us-east-1 
```

### AWS IAM Requirements

The IAM role attached to your EKS worker nodes needs the following permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name"
        }
    ]
}
```

### Configuration Options

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of pods | `2` |
| `image.repository` | Container image | `noylevi/journai-backend` |
| `image.tag` | Image tag | `v2.1` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |
| `aws.region` | AWS region | `us-east-1` |
| `aws.s3.bucket` | S3 bucket for uploads | `journai-uploads` |
| `database.host` | RDS endpoint | `` |
| `database.name` | Database name | `journai` |
| `database.user` | Database user | `postgres` |
| `database.port` | Database port | `5432` |
| `resources.requests.cpu` | CPU request | `100m` |
| `resources.requests.memory` | Memory request | `256Mi` |
| `resources.limits.cpu` | CPU limit | `500m` |
| `resources.limits.memory` | Memory limit | `1Gi` |
| `backend.image.tag` | Backend image tag | `v2.1` |
| `frontend.replicaCount` | Number of frontend pods | `2` |
| `frontend.image.repository` | Frontend image | `noylevi/journai-frontend` |
| `frontend.image.tag` | Frontend image tag | `v1.4` |
| `ingress.enabled` | Enable ingress | `true` |
| `ingress.className` | Ingress class | `traefik` |
| `ingress.hosts[0].host` | Hostname | `journai.site` |
| `backend.persistence.size` | Storage size | `10Gi` |

## 📦 What's Included

- **Backend Deployment** - Node.js API server (2 replicas)
- **Frontend Deployment** - React SPA (2 replicas)
- **PostgreSQL** - Database (RDS)
- **ConfigMap** - Non-secret configuration
- **Secret** - Sensitive data (API keys, passwords)
- **PVC** - Persistent storage for uploads
- **Ingress** - HTTP routing
- **Services** - Internal networking

## 🔒 Security Features

- ✅ Non-root containers
- ✅ Read-only root filesystem (where possible)
- ✅ Dropped all capabilities
- ✅ Secrets management with keep policy
- ✅ Security contexts on all pods

## 📊 Architecture

```
Internet
   ↓
Ingress (journai.site)
   ↓
├─→ Frontend Service → Frontend Pods (React)
└─→ Backend Service → Backend Pods (Node.js)
                         ↓
                    PostgreSQL (RDS)
                         ↓
                    S3 (uploads)
```

## 🛠️ Common Tasks

### Update Backend Image

```bash
# Edit values.yaml
backend:
  image:
    tag: "v2.3"

# Apply
helm upgrade journai . -n journai 
```

### Scale Replicas

```bash
helm upgrade journai . -n journai \
  --set backend.replicaCount=3 \
  --set frontend.replicaCount=3 
```

### View Logs

```bash
# Backend logs
kubectl logs -n journai -l app.kubernetes.io/component=backend --tail=100

# Frontend logs
kubectl logs -n journai -l app.kubernetes.io/component=frontend --tail=100
```

## 🌐 Production Deployment (AWS)

### Domain & SSL Configuration

JournAI is configured to use a custom domain with automatic SSL certificate management:

- **Domain**: `journai.site`
- **SSL Certificates**: Managed by AWS Certificate Manager (ACM)
- **DNS**: Configured with Amazon Route 53
- **Ingress**: Automatic certificate validation and HTTPS redirection

### AWS Infrastructure Components

The deployment leverages the following AWS services:
- **ACM** for SSL/TLS certificate management
- **Route 53** for DNS and domain management
- **ALB Ingress Controller** for routing traffic to services
- **Certificate auto-discovery** for dynamic SSL certificate management

### Prerequisites

1. EKS cluster
2. AWS Load Balancer Controller
3. Route53 hosted zone
4. ACM certificate (for HTTPS)

### Configuration

```yaml
# values-production.yaml
ingress:
  className: alb
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:...
    alb.ingress.kubernetes.io/ssl-redirect: '443'
  hosts:
    - host: journai.yourdomain.com

backend:
  persistence:
    storageClass: gp3
```

## 🔄 Upgrade Strategy

The chart uses `RollingUpdate` strategy:
- Zero-downtime deployments
- Gradual rollout
- Automatic rollback on failure

## 📝 Notes

- **Data Retention**: Data is kept on uninstall (annotation: `helm.sh/resource-policy: keep`)
- **Secrets Retention**: Secrets are kept on uninstall

## 🐛 Troubleshooting

### Pods not starting

```bash
kubectl describe pod -n journai <pod-name>
kubectl logs -n journai <pod-name>
```

### Permission denied on uploads

```bash
# Check init container logs
kubectl logs -n journai <backend-pod> -c fix-permissions

# Manually fix (if needed)
kubectl exec -n journai deployment/backend -- chmod -R 777 /app/uploads
```

## 📚 More Documentation

- [Application README](../JournAI-App/README.md)
- [Main README](../README.md)

## 🤝 Contributing

1. Make changes to templates or values
2. Test with `helm template . > test.yaml`
3. Install in test namespace
4. Verify functionality
5. Update this README