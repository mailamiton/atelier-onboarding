# Deployment Guide

Complete guide for deploying the Atelier Registration & Admin System to production.

## 🎯 Prerequisites

### Required Accounts
- [ ] AWS Account (Free tier eligible)
- [ ] Vercel Account (Free tier available)
- [ ] Domain name (optional but recommended)
- [ ] SMTP email service (Gmail or custom)

### Required Tools
```bash
# Node.js and npm
node --version  # v18+
npm --version   # v9+

# Python
python --version  # v3.9+

# AWS CLI
aws --version

# Vercel CLI
vercel --version

# PostgreSQL client
psql --version
```

## 📋 Pre-Deployment Checklist

### 1. Environment Variables

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://your-api-gateway-url.amazonaws.com/prod
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_COGNITO_REGION=us-east-1
```

#### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@your-rds-endpoint:5432/atelier_db
AWS_REGION=us-east-1
AWS_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
AWS_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
AWS_COGNITO_REGION=us-east-1
JWT_SECRET_KEY=your-super-secret-key-min-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
FROM_EMAIL=noreply@ashishpatelatelier.com
ENVIRONMENT=production
DEBUG=False
CORS_ORIGINS=https://your-frontend-domain.vercel.app
```

## 🔐 Step 1: AWS Cognito Setup

### Create User Pool
```bash
# Create user pool
aws cognito-idp create-user-pool \
  --pool-name atelier-users-prod \
  --policies '{
    "PasswordPolicy": {
      "MinimumLength": 6,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true,
      "RequireSymbols": true
    }
  }' \
  --auto-verified-attributes email \
  --username-attributes email \
  --mfa-configuration OFF

# Note the UserPoolId from output
```

### Create App Client
```bash
# Create app client
aws cognito-idp create-user-pool-client \
  --user-pool-id YOUR_USER_POOL_ID \
  --client-name atelier-web-client \
  --no-generate-secret \
  --explicit-auth-flows ADMIN_NO_SRP_AUTH USER_PASSWORD_AUTH \
  --read-attributes email name \
  --write-attributes email name

# Note the ClientId from output
```

### Create Admin User
```bash
# Create admin user
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username admin@ashishpatelatelier.com \
  --user-attributes Name=email,Value=admin@ashishpatelatelier.com Name=name,Value="Admin User" \
  --temporary-password TempPass123! \
  --message-action SUPPRESS

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id YOUR_USER_POOL_ID \
  --username admin@ashishpatelatelier.com \
  --password YourSecurePassword123! \
  --permanent
```

## 🗄️ Step 2: Database Setup (AWS RDS)

### Create RDS Instance
```bash
# Create subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name atelier-subnet-group \
  --db-subnet-group-description "Subnet group for Atelier DB" \
  --subnet-ids subnet-xxxxx subnet-yyyyy

# Create security group
aws ec2 create-security-group \
  --group-name atelier-db-sg \
  --description "Security group for Atelier RDS" \
  --vpc-id vpc-xxxxx

# Add inbound rule for PostgreSQL
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 5432 \
  --cidr 0.0.0.0/0  # Restrict this in production!

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier atelier-db-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 13.7 \
  --master-username atelieradmin \
  --master-user-password YOUR_DB_PASSWORD \
  --allocated-storage 20 \
  --storage-type gp2 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name atelier-subnet-group \
  --backup-retention-period 7 \
  --no-publicly-accessible  # Set to true for easier access initially

# Wait for instance to be available (5-10 minutes)
aws rds wait db-instance-available --db-instance-identifier atelier-db-prod

# Get endpoint
aws rds describe-db-instances \
  --db-instance-identifier atelier-db-prod \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

### Initialize Database
```bash
# Connect to database
psql -h your-rds-endpoint.rds.amazonaws.com \
     -U atelieradmin \
     -d postgres

# Create database
CREATE DATABASE atelier_db;
\c atelier_db

# Exit psql
\q

# Run migrations from local machine
cd APIS
export DATABASE_URL="postgresql://atelieradmin:YOUR_DB_PASSWORD@your-rds-endpoint.rds.amazonaws.com:5432/atelier_db"
alembic upgrade head
```

## ⚡ Step 3: Backend Deployment (AWS Lambda)

### Option A: Manual Deployment

```bash
cd APIS

# Run the packaging script
./package-lambda.sh

# This script will:
# - Clean up old deployment artifacts
# - Install Python dependencies
# - Copy application code
# - Create lambda-deployment.zip

# Create IAM role for Lambda
aws iam create-role \
  --role-name atelier-lambda-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach policies
aws iam attach-role-policy \
  --role-name atelier-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam attach-role-policy \
  --role-name atelier-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonCognitoPowerUser

# Create Lambda function (FIRST TIME ONLY)
aws lambda create-function \
  --function-name atelier-api-prod \
  --runtime python3.9 \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/atelier-lambda-role \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://lambda-deployment.zip \
  --timeout 30 \
  --memory-size 512 \
  --region ap-south-1 \
  --environment Variables="{
    DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/atelier_db,
    AWS_COGNITO_USER_POOL_ID=YOUR_USER_POOL_ID,
    AWS_COGNITO_CLIENT_ID=YOUR_CLIENT_ID,
    AWS_COGNITO_REGION=ap-south-1,
    SMTP_HOST=smtp.gmail.com,
    SMTP_PORT=587,
    SMTP_USER=your-email@gmail.com,
    SMTP_PASSWORD=YOUR_SMTP_PASSWORD,
    FROM_EMAIL=noreply@ashishpatelatelier.com,
    ENVIRONMENT=production,
    CORS_ORIGINS=https://your-frontend-domain.vercel.app
  }"

# OR Update existing Lambda function (SUBSEQUENT DEPLOYMENTS)
# Update function code
aws lambda update-function-code \
  --function-name atelier-api-prod \
  --zip-file fileb://lambda-deployment.zip \
  --region ap-south-1

# Update function configuration/environment variables
aws lambda update-function-configuration \
  --function-name atelier-api-prod \
  --timeout 30 \
  --memory-size 512 \
  --region ap-south-1 \
  --environment Variables="{
    DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/atelier_db,
    AWS_COGNITO_USER_POOL_ID=YOUR_USER_POOL_ID,
    AWS_COGNITO_CLIENT_ID=YOUR_CLIENT_ID,
    AWS_COGNITO_REGION=ap-south-1,
    SMTP_HOST=smtp.gmail.com,
    SMTP_PORT=587,
    SMTP_USER=your-email@gmail.com,
    SMTP_PASSWORD=YOUR_SMTP_PASSWORD,
    FROM_EMAIL=noreply@ashishpatelatelier.com,
    ENVIRONMENT=production,
    CORS_ORIGINS=https://your-frontend-domain.vercel.app
  }"
```

### Option B: Serverless Framework

```bash
cd APIS

# Install Serverless Framework
npm install -g serverless

# Install plugins
npm install --save-dev serverless-python-requirements

# Deploy
serverless deploy --stage prod
```

### Create API Gateway

```bash
# Create REST API
aws apigatewayv2 create-api \
  --name atelier-api-prod \
  --protocol-type HTTP \
  --target arn:aws:lambda:us-east-1:YOUR_ACCOUNT_ID:function:atelier-api-prod

# Note the API ID from output

# Grant API Gateway permission to invoke Lambda
aws lambda add-permission \
  --function-name atelier-api-prod \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:YOUR_ACCOUNT_ID:YOUR_API_ID/*/*"

# Create route
aws apigatewayv2 create-route \
  --api-id YOUR_API_ID \
  --route-key 'ANY /{proxy+}' \
  --target integrations/YOUR_INTEGRATION_ID

# Deploy API
aws apigatewayv2 create-stage \
  --api-id YOUR_API_ID \
  --stage-name prod \
  --auto-deploy

# Get API endpoint
echo "https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod"
```

## 🌐 Step 4: Frontend Deployment (Vercel)

### Deploy via Vercel CLI

```bash
cd UI

# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod

vercel env add NEXT_PUBLIC_COGNITO_USER_POOL_ID production
# Enter: YOUR_USER_POOL_ID

vercel env add NEXT_PUBLIC_COGNITO_CLIENT_ID production
# Enter: YOUR_CLIENT_ID

vercel env add NEXT_PUBLIC_COGNITO_REGION production
# Enter: us-east-1

# Redeploy with env vars
vercel --prod
```

### Deploy via GitHub Integration

1. Push code to GitHub
2. Import repository in Vercel dashboard
3. Configure environment variables in Vercel project settings
4. Deploy

## ✅ Step 5: Post-Deployment Verification

### Test Backend

```bash
# Health check
curl https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/health

# Create test registration (public endpoint)
curl -X POST https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/api/registrations \
  -H "Content-Type: application/json" \
  -d '{
    "student_name": "Test Student",
    "student_age": 12,
    "grade": "7",
    "parent_name": "Test Parent",
    "email": "test@example.com",
    "phone": "+1234567890"
  }'
```

### Test Frontend

1. Visit https://your-domain.vercel.app
2. Test registration form
3. Test admin login at /admin/login
4. Verify email notifications

### Monitor Logs

```bash
# Lambda logs
aws logs tail /aws/lambda/atelier-api-prod --follow

# RDS logs
aws rds describe-db-log-files --db-instance-identifier atelier-db-prod
```

## 🔧 Step 6: Custom Domain (Optional)

### Frontend Domain

1. Go to Vercel project settings
2. Add custom domain
3. Update DNS records as instructed

### Backend Domain

```bash
# Create custom domain in API Gateway
aws apigatewayv2 create-domain-name \
  --domain-name api.yourdomain.com \
  --domain-name-configurations CertificateArn=arn:aws:acm:us-east-1:YOUR_ACCOUNT_ID:certificate/YOUR_CERT_ID

# Create API mapping
aws apigatewayv2 create-api-mapping \
  --domain-name api.yourdomain.com \
  --api-id YOUR_API_ID \
  --stage prod

# Update DNS with API Gateway endpoint
```

## 📊 Step 7: Monitoring & Logging

### CloudWatch Alarms

```bash
# Create alarm for Lambda errors
aws cloudwatch put-metric-alarm \
  --alarm-name atelier-lambda-errors \
  --alarm-description "Alert on Lambda function errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --dimensions Name=FunctionName,Value=atelier-api-prod
```

## 🔐 Step 8: Security Hardening

### Enable HTTPS Only
- Vercel: Automatic
- API Gateway: Enabled by default

### Restrict CORS Origins
Update Lambda environment:
```env
CORS_ORIGINS=https://your-actual-domain.vercel.app
```

### Database Security
```bash
# Restrict RDS security group to Lambda only
aws ec2 authorize-security-group-ingress \
  --group-id YOUR_DB_SG_ID \
  --protocol tcp \
  --port 5432 \
  --source-group YOUR_LAMBDA_SG_ID
```

### Enable Rate Limiting
Configure in API Gateway throttling settings

## 🔄 Step 9: CI/CD Setup (Optional)

### GitHub Actions for Frontend

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### GitHub Actions for Backend

```yaml
name: Deploy Lambda
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: cd APIS && serverless deploy --stage prod
```

## 📝 Maintenance Tasks

### Database Backups
```bash
# Manual backup
aws rds create-db-snapshot \
  --db-instance-identifier atelier-db-prod \
  --db-snapshot-identifier atelier-backup-$(date +%Y%m%d)
```

### Update Lambda Code
```bash
cd APIS
# Make changes, then:
zip -r lambda-deployment.zip .
aws lambda update-function-code \
  --function-name atelier-api-prod \
  --zip-file fileb://lambda-deployment.zip
```

### View Logs
```bash
# Lambda logs
aws logs tail /aws/lambda/atelier-api-prod --follow

# Vercel logs
vercel logs your-deployment-url
```

## 🆘 Troubleshooting

### Common Issues

1. **CORS Errors**: Check CORS_ORIGINS environment variable
2. **Database Connection**: Verify RDS security group and DATABASE_URL
3. **Authentication Fails**: Verify Cognito configuration
4. **Email Not Sending**: Check SMTP credentials and port

### Support Resources
- AWS Documentation: https://docs.aws.amazon.com
- Vercel Documentation: https://vercel.com/docs
- FastAPI Documentation: https://fastapi.tiangolo.com

---

**Congratulations!** 🎉 Your application is now deployed and ready for production use.
