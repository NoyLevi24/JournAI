# JournAI Helm Chart

Kubernetes Helm chart for deploying JournAI on AWS EKS - AI-powered travel planning application with S3 and RDS integration.

## 🚀 Quick Start

### Prerequisites

1. **AWS EKS Cluster** - Deployed using the [Terraform repository](https://github.com/your-org/journai-terraform)
2. **kubectl** configured to access your EKS cluster
3. **Helm** (v3.0+)

### Installation

```bash
# Add the repository (if published)
helm repo add journai https://charts.your-domain.com/

# Install with AWS configuration
helm upgrade --install journai . \
  -n journai \
  --create-namespace \
  -f values-secrets.yaml \
  --set aws.region=your-region \
  --set aws.s3.bucket=your-bucket-name \
  --set database.host=your-rds-endpoint
```

### Upgrading

```bash
helm upgrade journai . -n journai -f values-secrets.yaml
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

### Required: Create Secrets File

1. Copy the example file and update with your secrets:

```bash
cp values-secrets.yaml.example values-secrets.yaml
```

2. Edit the file with your AWS and database credentials:

```yaml
# values-secrets.yaml
aws:
  accessKeyId: "your-aws-access-key"
  secretAccessKey: "your-aws-secret-key"
  region: "your-aws-region"
  s3:
    bucket: "your-s3-bucket-name"

database:
  host: "your-rds-endpoint.rds.amazonaws.com"
  name: "journai"
  user: "postgres"
  password: "your-db-password"

jwtSecret: "your-jwt-secret"
geminiApiKey: "your-gemini-api-key"
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
| `image.repository` | Container image | `your-ecr-repo/journai` |
| `image.tag` | Image tag | `latest` |
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
| `backend.image.tag` | Backend image tag | `v1.4` |
| `frontend.replicaCount` | Number of frontend pods | `2` |
| `frontend.image.repository` | Frontend image | `noylevi/journai-frontend` |
| `frontend.image.tag` | Frontend image tag | `v1.2` |
| `ingress.enabled` | Enable ingress | `true` |
| `ingress.className` | Ingress class | `traefik` |
| `ingress.hosts[0].host` | Hostname | `journai.com` |
| `backend.persistence.size` | Storage size | `10Gi` |

## 📦 What's Included

- **Backend Deployment** - Node.js API server (2 replicas)
- **Frontend Deployment** - React SPA (2 replicas)
- **PostgreSQL** - Database for production
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
Ingress (journai.com)
   ↓
├─→ Frontend Service → Frontend Pods (React)
└─→ Backend Service → Backend Pods (Node.js)
                         ↓
                    PostgreSQL
                         ↓
                    PVC (uploads)
```

## 🛠️ Common Tasks

### Update Backend Image

```bash
# Edit values.yaml
backend:
  image:
    tag: "v1.5"

# Apply
helm upgrade journai . -n journai -f values-secrets.yaml
```

### Scale Replicas

```bash
helm upgrade journai . -n journai \
  --set backend.replicaCount=3 \
  --set frontend.replicaCount=3 \
  -f values-secrets.yaml
```

### View Logs

```bash
# Backend logs
kubectl logs -n journai -l app.kubernetes.io/component=backend --tail=100

# Frontend logs
kubectl logs -n journai -l app.kubernetes.io/component=frontend --tail=100
```

### Access Database

```bash
kubectl exec -n journai deployment/postgresql -it -- psql -U journai -d journai
```

## 🌐 Production Deployment (AWS)

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

### Deploy

```bash
helm install journai . -n journai \
  -f values.yaml \
  -f values-production.yaml \
  -f values-secrets.yaml
```

## 🔄 Upgrade Strategy

The chart uses `RollingUpdate` strategy:
- Zero-downtime deployments
- Gradual rollout
- Automatic rollback on failure

## 📝 Notes

- **PVC Retention**: PVCs are kept on uninstall (annotation: `helm.sh/resource-policy: keep`)
- **Secrets Retention**: Secrets are kept on uninstall
- **Database**: PostgreSQL data is stored on the same PVC as uploads (consider separating for production)

## 🐛 Troubleshooting

### Pods not starting

```bash
kubectl describe pod -n journai <pod-name>
kubectl logs -n journai <pod-name>
```

### Database connection issues

```bash
# Check PostgreSQL is running
kubectl get pods -n journai -l app.kubernetes.io/component=postgresql

# Check logs
kubectl logs -n journai deployment/postgresql
```

### Permission denied on uploads

```bash
# Check init container logs
kubectl logs -n journai <backend-pod> -c fix-permissions

# Manually fix (if needed)
kubectl exec -n journai deployment/backend -- chmod -R 777 /app/uploads
```

## 📚 More Documentation

- [Deployment Guide](../docs/DEPLOYMENT.md)
- [RDS Migration](../docs/RDS-MIGRATION.md)

## 🤝 Contributing

1. Make changes to templates or values
2. Test with `helm template . > test.yaml`
3. Install in test namespace
4. Verify functionality
5. Update this README