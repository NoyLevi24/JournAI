# JournAI Helm Chart

Kubernetes Helm chart for deploying JournAI - AI-powered travel planning application.

## 🚀 Quick Start

```bash
# Install the chart
helm install journai . -n journai -f values-secrets.yaml

# Upgrade
helm upgrade journai . -n journai -f values-secrets.yaml

# Uninstall
helm uninstall journai -n journai
```

## 📋 Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- PV provisioner support (for persistent storage)

## 🔧 Configuration

### Required: Create Secrets File

```bash
# Copy the example
cp values-secrets.yaml.example values-secrets.yaml

# Edit with your real secrets
vim values-secrets.yaml
```

**values-secrets.yaml:**
```yaml
secrets:
  jwtSecret: "your-jwt-secret-here"
  geminiApiKey: "your-gemini-api-key"  # Get from https://ai.google.dev/
  openaiApiKey: ""  # Optional
  dbPassword: "your-db-password"
```

### Configuration Options

| Parameter | Description | Default |
|-----------|-------------|---------|
| `backend.replicaCount` | Number of backend pods | `2` |
| `backend.image.repository` | Backend image | `noylevi/journai-backend` |
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