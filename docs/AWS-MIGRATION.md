# AWS RDS and S3 Migration Guide

This guide will walk you through setting up AWS RDS for PostgreSQL and S3 for file storage in your JournAI application.

## Prerequisites

1. AWS account with appropriate permissions
2. AWS CLI configured with access keys
3. `kubectl` configured to connect to your Kubernetes cluster
4. Helm installed

## 1. Set up AWS RDS for PostgreSQL

### Create an RDS Instance

1. Go to the AWS RDS Console
2. Click "Create database"
3. Choose "Standard create" and "PostgreSQL"
4. Select the latest stable PostgreSQL version
5. In "Templates", select "Free tier" for development or "Production" for production
6. Configure the DB instance:
   - DB instance identifier: `journai-db`
   - Master username: `journai`
   - Master password: [create a secure password]
   - DB instance class: `db.t3.micro` (for development) or larger for production
   - Storage: 20GB (adjust based on your needs)
   - Storage type: General Purpose (SSD)
7. Under "Connectivity":
   - Set to be publicly accessible (for development) or use VPC peering for production
   - Create a new VPC security group
   - Set the initial database name to `journai`
8. Click "Create database"

### Configure Security Group

1. Go to the RDS console and select your database
2. Under "Connectivity & security", note the endpoint and port
3. Click on the VPC security group
4. Add an inbound rule to allow PostgreSQL (port 5432) from your application's security group or IP address

## 2. Set up S3 Bucket

### Create an S3 Bucket

1. Go to the AWS S3 Console
2. Click "Create bucket"
3. Enter a globally unique bucket name (e.g., `journai-uploads-<your-account-id>`)
4. Select the AWS region closest to your users
5. Uncheck "Block all public access" and acknowledge the warning
6. Click "Create bucket"

### Configure CORS for S3 Bucket

1. Select your bucket
2. Go to the "Permissions" tab
3. Scroll down to "Cross-origin resource sharing (CORS)" and click "Edit"
4. Add the following CORS configuration:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["*"],  // Restrict this to your domain in production
       "ExposeHeaders": []
     }
   ]
   ```
5. Click "Save changes"

### Create an IAM User for S3 Access

1. Go to the IAM Console
2. Click "Users" and then "Add user"
3. Enter a username (e.g., `journai-s3-user`)
4. Select "Programmatic access"
5. Click "Next: Permissions"
6. Click "Attach existing policies directly"
7. Search for and select `AmazonS3FullAccess` (for production, create a custom policy with least privilege)
8. Click "Next: Tags" (optional)
9. Click "Next: Review"
10. Click "Create user"
11. **Important**: Copy the Access key ID and Secret access key (you won't be able to see the secret key again)

## 3. Update Helm Values

Update your `values.yaml` file with the RDS and S3 configuration:

```yaml
# Database configuration
database:
  type: rds
  rds:
    host: "your-rds-endpoint.region.rds.amazonaws.com"  # Replace with your RDS endpoint
    port: 5432
    name: "journai"
    username: "journai"

# S3 Configuration
s3:
  enabled: true
  bucket: "your-s3-bucket-name"  # Replace with your S3 bucket name
  region: "your-aws-region"      # e.g., us-east-1

# Secrets configuration
secrets:
  useExistingSecret: false
  jwtSecret: "your-jwt-secret"
  geminiApiKey: ""  # Optional
  openaiApiKey: ""  # Optional
  dbPassword: "your-db-password"  # The password you set for the RDS instance
  awsAccessKeyId: "your-aws-access-key"  # From IAM user
  awsSecretAccessKey: "your-aws-secret-key"  # From IAM user
```

## 4. Deploy the Application

1. Install or upgrade your Helm release:
   ```bash
   # If installing for the first time
   helm install journai ./JournAI-Chart -f ./JournAI-Chart/values.yaml
   
   # If upgrading
   helm upgrade --install journai ./JournAI-Chart -f ./JournAI-Chart/values.yaml
   ```

2. Verify the deployment:
   ```bash
   kubectl get pods
   kubectl logs -f deployment/journai-backend
   ```

## 5. Verify the Setup

1. Check the backend logs for any errors:
   ```bash
   kubectl logs -f deployment/journai-backend
   ```

2. Port-forward to the backend service and test the API:
   ```bash
   kubectl port-forward svc/journai-backend 3000:3000
   ```

3. Test file uploads to S3 by using the application's file upload feature

## 6. (Optional) Set up Database Backups

1. Go to the RDS Console
2. Select your database
3. Under "Maintenance & backups", configure automated backups
4. Set a backup retention period (e.g., 7 days for development, 30+ days for production)
5. Configure backup windows during off-peak hours

## 7. (Optional) Set up S3 Lifecycle Policies

1. Go to the S3 Console
2. Select your bucket
3. Go to the "Management" tab
4. Click "Create lifecycle rule"
5. Configure rules for transitioning objects to cheaper storage classes or expiring old objects

## Troubleshooting

### Database Connection Issues
- Verify the RDS security group allows traffic from your application
- Check that the database username and password are correct
- Ensure the database is publicly accessible (for development) or that VPC peering is properly configured

### S3 Upload Issues
- Verify the IAM user has the correct permissions
- Check that the S3 bucket name and region are correct
- Ensure the CORS configuration allows requests from your application's domain

### Performance Issues
- For production, consider using RDS Proxy for better connection management
- Enable S3 Transfer Acceleration if your users are geographically distributed
- Consider using a CDN like CloudFront in front of your S3 bucket for static assets

## Security Considerations

1. **Database Security**:
   - Use SSL/TLS for database connections
   - Rotate database credentials regularly
   - Enable encryption at rest and in transit

2. **S3 Security**:
   - Use bucket policies to restrict access
   - Enable versioning and MFA delete for production buckets
   - Use S3 access logs to monitor access patterns

3. **Kubernetes Secrets**:
   - Consider using a secret management solution like AWS Secrets Manager or HashiCorp Vault
   - Enable encryption at rest for Kubernetes secrets
