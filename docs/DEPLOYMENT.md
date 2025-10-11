# JournAI - Deployment Guide

## Recent Security & UX Improvements ✅

### 1. Security Hardening
- **Non-root containers**: Both backend and frontend now run as user `10001:10001`
- **Kubernetes security contexts**: Pod and container-level security policies enforced
- **Minimal capabilities**: All capabilities dropped, privilege escalation prevented
- **Read-only filesystem**: Frontend runs with read-only root filesystem

### 2. Modern UI with Lucide Icons
- Replaced all emoji icons with professional SVG icons from `lucide-react`
- Cleaner, more consistent design across the application
- Better accessibility and scalability

### 3. State Persistence
- Route and trip selection now persist across page reloads
- Uses `localStorage` for seamless user experience
- No data loss when navigating between pages

### 4. Clean Project Structure
- Removed duplicate files and build artifacts
- Optimized `.gitignore` for the project structure
- Organized workspace with proper separation of concerns

---

## Building Docker Images

### Backend
```bash
cd JournAI-App
docker build -f backend/Dockerfile -t noylevi/journai-backend:v1.1 .
docker push noylevi/journai-backend:v1.1
```

### Frontend
```bash
cd JournAI-App
docker build -f frontend/Dockerfile -t noylevi/journai-frontend:v1.1 .
docker push noylevi/journai-frontend:v1.1
```

**Important Notes:**
- Backend runs on port **3000** as user `10001`
- Frontend runs on port **8080** (not 80) as user `10001`
- Both containers have proper file permissions for runtime directories

---

## Deploying with Helm

### Update Image Tags
Edit `JournAI-Chart/values.yaml`:
```yaml
backend:
  image:
    tag: "v1.1"

frontend:
  image:
    tag: "v1.1"
```

### Install/Upgrade
```bash
cd JournAI-Chart

# First time installation
helm install journai . \
  --set secrets.jwtSecret="your-secret-key" \
  --set secrets.openaiApiKey="your-openai-key" \
  --set secrets.dbPassword="your-db-password"

# Upgrade existing deployment
helm upgrade journai . --reuse-values
```

### Verify Deployment
```bash
# Check pods are running as non-root
kubectl get pods -l app.kubernetes.io/name=journai
kubectl describe pod <pod-name> | grep -A 5 "Security Context"

# Check services
kubectl get svc -l app.kubernetes.io/name=journai

# Check ingress
kubectl get ingress
```

---

## Local Development

### Option 1: Docker Compose (Recommended)

**Production mode with PostgreSQL:**
```bash
cd JournAI-App
docker compose up -d
# Frontend: http://localhost (port 80)
# Backend: http://localhost:3000
# PostgreSQL: localhost:5432
```

**Development mode with hot-reload:**
```bash
cd JournAI-App
docker compose -f docker-compose.dev.yml up
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
# PostgreSQL Dev: localhost:5432 (journai_dev database)
# Note: Uses PostgreSQL for AWS RDS compatibility
```

### Option 2: Manual Setup

**Backend:**
```bash
cd JournAI-App/backend
npm install
mkdir -p data uploads  # Create runtime directories
npm start
# Runs on http://localhost:3000
```

**Frontend:**
```bash
cd JournAI-App/frontend
npm install
npm run dev
# Runs on http://localhost:5173
# Proxies /api and /uploads to backend
```

**Note:** Both services run as user 10001:10001 in Docker for security.

---

## Security Context Details

### Backend Pod Security
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 10001
  runAsGroup: 10001
  fsGroup: 10001
  allowPrivilegeEscalation: false
  capabilities:
    drop: ["ALL"]
```

### Frontend Pod Security
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 10001
  runAsGroup: 10001
  fsGroup: 10001
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop: ["ALL"]
```

---

## Port Configuration

| Service  | Container Port | Service Port | Notes                    |
|----------|---------------|--------------|--------------------------|
| Backend  | 3000          | 3000         | Node.js Express server   |
| Frontend | 8080          | 80           | Nginx (non-privileged)   |

---

## Troubleshooting

### Permission Errors
If you see permission errors in pods:
```bash
# Check if volumes have correct ownership
kubectl exec -it <pod-name> -- ls -la /app/uploads
# Should show ownership: 10001:10001
```

### Frontend Not Loading
```bash
# Check nginx is listening on 8080
kubectl exec -it <frontend-pod> -- netstat -tlnp | grep 8080

# Check logs
kubectl logs <frontend-pod>
```

### State Not Persisting
- Clear browser localStorage: `localStorage.clear()`
- Check browser console for errors
- Verify `journai_route` and `journai_tripId` keys exist in localStorage

---

## Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=3000
DB_CLIENT=postgres
DB_HOST=journai-postgresql
DB_PORT=5432
DB_NAME=journai
DB_USER=journai
DB_PASSWORD=<from-secret>
JWT_SECRET=<from-secret>
OPENAI_API_KEY=<from-secret>
```

### Frontend
No environment variables needed - all configuration is done at build time.

---

## Next Steps

1. **Update image tags** to `v1.1` in `values.yaml`
2. **Rebuild and push** Docker images
3. **Upgrade Helm release** with new images
4. **Test security contexts** with `kubectl describe pod`
5. **Verify UI improvements** - check icons and state persistence

---

## AWS RDS Migration Guide

### ✅ Application is RDS-Ready!

The application **fully supports PostgreSQL** and is ready for AWS RDS migration.

**What's been implemented:**
- ✅ PostgreSQL client (`pg`) integrated
- ✅ Automatic SQL placeholder conversion (`?` → `$1, $2`)
- ✅ RETURNING clause for INSERT statements
- ✅ Full schema compatibility (SERIAL, TIMESTAMP, etc.)
- ✅ Tested and working with PostgreSQL 16

**See `RDS-MIGRATION.md` for detailed migration steps.**

### Quick RDS Setup:

**1. Create RDS PostgreSQL Instance:**
```bash
# Via AWS Console or CLI
aws rds create-db-instance \
  --db-instance-identifier journai-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16.1 \
  --master-username journai \
  --master-user-password <secure-password> \
  --allocated-storage 20 \
  --vpc-security-group-ids <sg-id> \
  --db-subnet-group-name <subnet-group>
```

**2. Update Backend Environment Variables:**
```yaml
# In Kubernetes secrets or docker-compose
DB_CLIENT: postgres
DB_HOST: journai-prod.xxxxxxxxxx.us-east-1.rds.amazonaws.com
DB_PORT: 5432
DB_NAME: journai
DB_USER: journai
DB_PASSWORD: <rds-password>
```

**3. Security Group Configuration:**
- Allow inbound traffic on port 5432 from your application's security group
- Enable SSL/TLS connections for production

**4. Connection Pooling (Recommended):**
Consider using RDS Proxy for:
- Connection pooling
- Automatic failover
- Enhanced security with IAM authentication

**5. Backup Strategy:**
- Enable automated backups (retention: 7-30 days)
- Configure backup window during low-traffic periods
- Test restore procedures regularly

**6. Monitoring:**
```bash
# Enable Enhanced Monitoring
# Set up CloudWatch alarms for:
# - CPU utilization > 80%
# - Free storage < 20%
# - Database connections > 80% of max
```

---

## Support

For issues or questions:
- Check pod logs: `kubectl logs <pod-name>`
- Describe pod: `kubectl describe pod <pod-name>`
- Check events: `kubectl get events --sort-by='.lastTimestamp'`
- PostgreSQL logs: `docker compose logs db` or check RDS logs in CloudWatch
