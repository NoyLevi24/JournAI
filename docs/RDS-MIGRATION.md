# JournAI - AWS RDS Migration Guide

## ✅ מה הושלם - הכנה ל-RDS

האפליקציה **מוכנה לחלוטין** למעבר ל-AWS RDS PostgreSQL!

### שינויים שבוצעו:

1. **תמיכה מלאה ב-PostgreSQL** ✅
   - הוספנו `pg` (PostgreSQL client) ל-dependencies
   - הקוד תומך בשני DBs: SQLite (dev) ו-PostgreSQL (production)
   - המרה אוטומטית של SQL placeholders: `?` → `$1, $2, ...`
   - תמיכה ב-`RETURNING id` ל-INSERT statements

2. **Schema מלא ב-PostgreSQL** ✅
   - כל הטבלאות נוצרות אוטומטית
   - Foreign keys מוגדרים נכון
   - Timestamps עם `TIMESTAMP` type
   - SERIAL במקום AUTOINCREMENT

3. **נבדק ועובד ב-Kubernetes** ✅
   - רץ עם PostgreSQL 16
   - כל ה-queries עובדים
   - אין שגיאות SQL
   - העלאת תמונות עובדת

---

## 🚀 איך לעבור ל-AWS RDS

### שלב 1: צור RDS Instance

```bash
aws rds create-db-instance \
  --db-instance-identifier journai-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16.1 \
  --master-username journai \
  --master-user-password <SECURE-PASSWORD> \
  --allocated-storage 20 \
  --storage-type gp3 \
  --vpc-security-group-ids <YOUR-SG-ID> \
  --db-subnet-group-name <YOUR-SUBNET-GROUP> \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00" \
  --publicly-accessible false \
  --storage-encrypted \
  --enable-cloudwatch-logs-exports '["postgresql"]'
```

**או דרך AWS Console:**
1. RDS → Create database
2. Engine: PostgreSQL 16.x
3. Templates: Production (או Dev/Test לפיתוח)
4. DB instance identifier: `journai-prod`
5. Master username: `journai`
6. Master password: (שמור במקום מאובטח!)
7. Instance configuration: db.t3.micro (או גדול יותר)
8. Storage: 20 GB gp3
9. VPC: בחר את ה-VPC שלך
10. Public access: No
11. VPC security group: צור חדש או בחר קיים
12. Database name: `journai`
13. Backup: 7 days retention
14. Encryption: Enable
15. Create database

### שלב 2: הגדר Security Group

```bash
# אפשר גישה מה-EKS cluster ל-RDS
aws ec2 authorize-security-group-ingress \
  --group-id <RDS-SG-ID> \
  --protocol tcp \
  --port 5432 \
  --source-group <EKS-NODE-SG-ID>
```

**או ב-Console:**
1. EC2 → Security Groups → בחר את ה-RDS SG
2. Inbound rules → Edit
3. Add rule:
   - Type: PostgreSQL
   - Port: 5432
   - Source: Security group של ה-EKS nodes
4. Save

### שלב 3: עדכן Kubernetes Secrets

```bash
# צור secret חדש עם פרטי RDS
kubectl create secret generic journai-rds-secret -n journai \
  --from-literal=DB_HOST='journai-prod.xxxxxxxxxx.us-east-1.rds.amazonaws.com' \
  --from-literal=DB_PORT='5432' \
  --from-literal=DB_NAME='journai' \
  --from-literal=DB_USER='journai' \
  --from-literal=DB_PASSWORD='<RDS-PASSWORD>' \
  --from-literal=DB_CLIENT='postgres'
```

### שלב 4: עדכן Helm Values

ערוך `values.yaml`:

```yaml
backend:
  env:
    - name: DB_CLIENT
      value: "postgres"
    - name: DB_HOST
      valueFrom:
        secretKeyRef:
          name: journai-rds-secret
          key: DB_HOST
    - name: DB_PORT
      valueFrom:
        secretKeyRef:
          name: journai-rds-secret
          key: DB_PORT
    - name: DB_NAME
      valueFrom:
        secretKeyRef:
          name: journai-rds-secret
          key: DB_NAME
    - name: DB_USER
      valueFrom:
        secretKeyRef:
          name: journai-rds-secret
          key: DB_USER
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: journai-rds-secret
          key: DB_PASSWORD
```

### שלב 5: Deploy

```bash
# Upgrade Helm release
helm upgrade journai ./JournAI-Chart -n journai

# בדוק שהכל עובד
kubectl get pods -n journai
kubectl logs -n journai -l app.kubernetes.io/component=backend --tail=50
```

אמור לראות:
```
✅ Connected to PostgreSQL
✅ PostgreSQL tables created/verified
Server running on http://localhost:3000
```

---

## 🔒 אבטחה נוספת (מומלץ)

### 1. SSL/TLS Connection

עדכן את `db.js` להוסיף SSL:

```javascript
pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'journai',
  user: process.env.DB_USER || 'journai',
  password: process.env.DB_PASSWORD || 'journai',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
})
```

הוסף ל-secrets:
```bash
kubectl patch secret journai-rds-secret -n journai \
  --type merge \
  -p '{"stringData":{"DB_SSL":"true"}}'
```

### 2. RDS Proxy (מומלץ ל-production)

```bash
aws rds create-db-proxy \
  --db-proxy-name journai-proxy \
  --engine-family POSTGRESQL \
  --auth '{"AuthScheme":"SECRETS","SecretArn":"<SECRET-ARN>"}' \
  --role-arn <ROLE-ARN> \
  --vpc-subnet-ids <SUBNET-1> <SUBNET-2> \
  --require-tls
```

שנה את `DB_HOST` ל-proxy endpoint:
```
journai-proxy.proxy-xxxxxxxxxx.us-east-1.rds.amazonaws.com
```

### 3. IAM Authentication (אופציונלי)

במקום password, השתמש ב-IAM:
```javascript
const token = await rds.Signer.getAuthToken({
  hostname: process.env.DB_HOST,
  port: 5432,
  username: process.env.DB_USER
})
```

---

## 📊 Monitoring & Backup

### CloudWatch Alarms

```bash
# CPU > 80%
aws cloudwatch put-metric-alarm \
  --alarm-name journai-rds-cpu \
  --alarm-description "RDS CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=journai-prod

# Free Storage < 2GB
aws cloudwatch put-metric-alarm \
  --alarm-name journai-rds-storage \
  --alarm-description "RDS Free Storage < 2GB" \
  --metric-name FreeStorageSpace \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 2000000000 \
  --comparison-operator LessThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=journai-prod
```

### Automated Backups

כבר מוגדר ב-RDS creation (7 days retention).

לשחזור:
```bash
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier journai-restored \
  --db-snapshot-identifier <SNAPSHOT-ID>
```

---

## 🧪 Testing המעבר

### 1. Test Connection

```bash
# מתוך pod
kubectl exec -it -n journai <backend-pod> -- sh
apk add postgresql-client
psql -h <RDS-ENDPOINT> -U journai -d journai
```

### 2. Test Queries

```sql
-- בדוק טבלאות
\dt

-- בדוק users
SELECT * FROM users LIMIT 5;

-- בדוק itineraries
SELECT * FROM itineraries LIMIT 5;
```

### 3. Test Application

1. התחבר לאתר
2. צור משתמש חדש
3. צור itinerary
4. העלה תמונה
5. צור album

---

## 💰 עלויות משוערות

**db.t3.micro (2 vCPU, 1GB RAM):**
- On-Demand: ~$0.017/hour = ~$12/month
- Reserved (1 year): ~$8/month
- Storage (20GB gp3): ~$2.5/month
- Backups (7 days): ~$2/month

**סה"כ: ~$14-16/month**

**db.t3.small (2 vCPU, 2GB RAM):**
- On-Demand: ~$0.034/hour = ~$25/month

---

## 🔄 Rollback Plan

אם משהו לא עובד:

```bash
# 1. חזור ל-PostgreSQL local
kubectl patch deployment backend -n journai \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"backend","env":[{"name":"DB_CLIENT","value":"postgres"},{"name":"DB_HOST","value":"journai-postgresql"}]}]}}}}'

# 2. או חזור ל-SQLite
kubectl patch deployment backend -n journai \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"backend","env":[{"name":"DB_CLIENT","value":"sqlite3"}]}]}}}}'

# 3. Restart pods
kubectl rollout restart deployment/backend -n journai
```

---

## ✅ Checklist למעבר

- [ ] RDS instance נוצר
- [ ] Security Group מוגדר
- [ ] Secrets נוצרו ב-Kubernetes
- [ ] Helm values עודכן
- [ ] Deploy בוצע
- [ ] Logs נבדקו - אין שגיאות
- [ ] התחברות לאתר עובדת
- [ ] יצירת משתמש עובדת
- [ ] יצירת itinerary עובדת
- [ ] העלאת תמונות עובדת
- [ ] CloudWatch alarms הוגדרו
- [ ] Backups מופעלים

---

## 📞 Support

אם יש בעיות:

1. בדוק logs: `kubectl logs -n journai -l app.kubernetes.io/component=backend`
2. בדוק connection: `kubectl exec -it <pod> -- env | grep DB`
3. בדוק RDS status: AWS Console → RDS → journai-prod
4. בדוק Security Groups: EC2 → Security Groups

---

**האפליקציה מוכנה ל-RDS! כל מה שצריך זה לעדכן את ה-connection strings.** 🚀
