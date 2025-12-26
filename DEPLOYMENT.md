# Production Deployment Guide

Complete step-by-step guide for deploying the Atelier Registration & Admin System.

---

## 📋 **Prerequisites**

### Required Accounts
- [ ] AWS Account with billing enabled
- [ ] Vercel Account (free tier)
- [ ] Gmail account for SMTP (or custom SMTP service)
- [ ] Domain name (optional)

### Required Tools
```bash
# Check versions
node --version    # v18+ required
npm --version     # v9+ required
python --version  # v3.9+ required
aws --version     # AWS CLI v2
psql --version    # PostgreSQL client
```

### Install Tools
```bash
# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS
aws configure
# Enter: Access Key ID, Secret Access Key, Region (ap-south-1), Output format (json)

# Vercel CLI
npm install -g vercel

# PostgreSQL client
sudo apt-get install postgresql-client
```

---

## 🚀 **Deployment Steps**

Follow these steps in order:

---

## **Step 1: Setup AWS Cognito (Authentication)**

### 1.1 Create User Pool
```bash
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
  --mfa-configuration OFF \
  --region ap-south-1

# ✅ SAVE THIS: Copy the UserPoolId from output (e.g., ap-south-1_XXXXXXXXX)
```

### 1.2 Create App Client
```bash
aws cognito-idp create-user-pool-client \
  --user-pool-id YOUR_USER_POOL_ID \
  --client-name atelier-web-client \
  --no-generate-secret \
  --explicit-auth-flows ADMIN_NO_SRP_AUTH USER_PASSWORD_AUTH \
  --read-attributes email name \
  --write-attributes email name \
  --region ap-south-1

# ✅ SAVE THIS: Copy the ClientId from output
```

### 1.3 Create Admin User
```bash
# Create admin user
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username admin@ashishpatelatelier.com \
  --user-attributes Name=email,Value=admin@ashishpatelatelier.com Name=name,Value="Admin User" \
  --temporary-password TempPass123! \
  --message-action SUPPRESS \
  --region ap-south-1

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id YOUR_USER_POOL_ID \
  --username admin@ashishpatelatelier.com \
  --password YourSecurePassword123! \
  --permanent \
  --region ap-south-1
```

**✅ Checkpoint:** You now have:
- User Pool ID
- Client ID
- Admin user credentials

---

## **Step 2: Setup Database (AWS RDS PostgreSQL)**

### 2.1 Create RDS Instance

```bash
# Create security group for RDS
aws ec2 create-security-group \
  --group-name atelier-db-sg \
  --description "Security group for Atelier RDS" \
  --vpc-id YOUR_VPC_ID \
  --region ap-south-1

# ✅ SAVE THIS: Note the security group ID

# Allow PostgreSQL access (port 5432)
aws ec2 authorize-security-group-ingress \
  --group-id YOUR_SG_ID \
  --protocol tcp \
  --port 5432 \
  --cidr 0.0.0.0/0 \
  --region ap-south-1

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier atelierdb \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 13.7 \
  --master-username atelierdb \
  --master-user-password "atelierdb#1019" \
  --allocated-storage 20 \
  --storage-type gp2 \
  --vpc-security-group-ids YOUR_SG_ID \
  --publicly-accessible \
  --backup-retention-period 7 \
  --region ap-south-1

# Wait for instance (5-10 minutes)
aws rds wait db-instance-available \
  --db-instance-identifier atelierdb \
  --region ap-south-1

# Get endpoint
aws rds describe-db-instances \
  --db-instance-identifier atelierdb \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text \
  --region ap-south-1

# ✅ SAVE THIS: Your RDS endpoint (e.g., atelierdb.crceg4sam0zb.ap-south-1.rds.amazonaws.com)
```

### 2.2 Create Database and Run Migrations

```bash
# Connect to RDS
psql -h atelierdb.crceg4sam0zb.ap-south-1.rds.amazonaws.com \
     -U atelierdb \
     -d postgres

# In psql, create database
CREATE DATABASE atelier_db;
\q

# On your server or local machine
cd ~/atelier-onboarding/APIS

# Activate virtual environment
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set database URL
export DATABASE_URL="postgresql://atelierdb:atelierdb#1019@atelierdb.crceg4sam0zb.ap-south-1.rds.amazonaws.com:5432/atelier_db"

# Create initial migration (if not exists)
alembic revision --autogenerate -m "Initial tables"

# Run migrations
alembic upgrade head

# Verify tables were created
psql "$DATABASE_URL" -c "\dt"
```

**✅ Checkpoint:** Database is ready with tables: `teachers`, `registrations`, `notifications`

---

## **Step 3: Deploy Backend API (AWS Lambda)**

### 3.1 Create IAM Role for Lambda

```bash
# Create Lambda execution role
aws iam create-role \
  --role-name atelier-lambda-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }' \
  --region ap-south-1

# Attach basic execution policy
aws iam attach-role-policy \
  --role-name atelier-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Attach Cognito access policy
aws iam attach-role-policy \
  --role-name atelier-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonCognitoPowerUser

# Wait 10 seconds for IAM propagation
sleep 10
```

### 3.2 Package Lambda Deployment

```bash
cd ~/atelier-onboarding/APIS

# Pull latest code
git pull origin main

# Run packaging script
./package-lambda.sh

# Verify zip was created
ls -lh lambda-deployment.zip
```

### 3.3 Create Lambda Function (First Time)

```bash
aws lambda create-function \
  --function-name atelier-api-prod \
  --runtime python3.9 \
  --role arn:aws:iam::841493805509:role/atelier-lambda-role \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://lambda-deployment.zip \
  --timeout 30 \
  --memory-size 512 \
  --region ap-south-1 \
  --environment Variables="{
    DATABASE_URL=postgresql://atelierdb:atelierdb#1019@atelierdb.crceg4sam0zb.ap-south-1.rds.amazonaws.com:5432/atelier_db,
    AWS_COGNITO_USER_POOL_ID=YOUR_USER_POOL_ID,
    AWS_COGNITO_CLIENT_ID=YOUR_CLIENT_ID,
    AWS_COGNITO_REGION=ap-south-1,
    SMTP_HOST=smtp.gmail.com,
    SMTP_PORT=587,
    SMTP_USER=your-email@gmail.com,
    SMTP_PASSWORD=your-gmail-app-password,
    FROM_EMAIL=noreply@ashishpatelatelier.com,
    ENVIRONMENT=production,
    CORS_ORIGINS=https://your-vercel-domain.vercel.app
  }"
```

### 3.4 Update Lambda Function (Subsequent Deployments)

```bash
# Update code only
aws lambda update-function-code \
  --function-name atelier-api-prod \
  --zip-file fileb://lambda-deployment.zip \
  --region ap-south-1

# Update environment variables
aws lambda update-function-configuration \
  --function-name atelier-api-prod \
  --timeout 30 \
  --memory-size 512 \
  --region ap-south-1 \
  --environment Variables="{
    DATABASE_URL=postgresql://atelierdb:atelierdb#1019@atelierdb.crceg4sam0zb.ap-south-1.rds.amazonaws.com:5432/atelier_db,
    AWS_COGNITO_USER_POOL_ID=YOUR_USER_POOL_ID,
    AWS_COGNITO_CLIENT_ID=YOUR_CLIENT_ID,
    AWS_COGNITO_REGION=ap-south-1,
    SMTP_HOST=smtp.gmail.com,
    SMTP_PORT=587,
    SMTP_USER=your-email@gmail.com,
    SMTP_PASSWORD=your-gmail-app-password,
    FROM_EMAIL=noreply@ashishpatelatelier.com,
    ENVIRONMENT=production,
    CORS_ORIGINS=https://your-vercel-domain.vercel.app
  }"
```

**✅ Checkpoint:** Lambda function is deployed

---

## **Step 4: Setup API Gateway**

### 4.1 Create HTTP API

```bash
# Create HTTP API with Lambda integration
aws apigatewayv2 create-api \
  --name atelier-api-prod \
  --protocol-type HTTP \
  --target arn:aws:lambda:ap-south-1:841493805509:function:atelier-api-prod \
  --region ap-south-1

# ✅ SAVE THIS: Copy the ApiId from output
```

### 4.2 Grant API Gateway Permission

```bash
aws lambda add-permission \
  --function-name atelier-api-prod \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:ap-south-1:841493805509:YOUR_API_ID/*/*" \
  --region ap-south-1
```

### 4.3 Create Stage and Get API URL

```bash
# Create production stage
aws apigatewayv2 create-stage \
  --api-id YOUR_API_ID \
  --stage-name prod \
  --auto-deploy \
  --region ap-south-1

# Get your API URL
echo "✅ Your API URL: https://YOUR_API_ID.execute-api.ap-south-1.amazonaws.com/prod"
```

### 4.4 Test API

```bash
# Test health endpoint
curl https://YOUR_API_ID.execute-api.ap-south-1.amazonaws.com/prod/health

# Expected: {"status":"healthy"}
```

**✅ Checkpoint:** API is accessible via API Gateway URL

---

## **Step 5: Deploy Frontend (Vercel)**

### 5.1 Configure Environment Variables in Vercel

1. Go to https://vercel.com/dashboard
2. Click **Add New** → **Project**
3. Import your GitHub repository `mailamiton/atelier-onboarding`
4. Set **Root Directory** to `UI`
5. Add these **Environment Variables**:

```
NEXT_PUBLIC_API_URL = https://YOUR_API_ID.execute-api.ap-south-1.amazonaws.com/prod
NEXT_PUBLIC_COGNITO_USER_POOL_ID = YOUR_USER_POOL_ID
NEXT_PUBLIC_COGNITO_CLIENT_ID = YOUR_CLIENT_ID
NEXT_PUBLIC_COGNITO_REGION = ap-south-1
```

6. Click **Deploy**

### 5.2 Alternative: Deploy via CLI

```bash
cd ~/atelier-onboarding/UI

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Add environment variables
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://YOUR_API_ID.execute-api.ap-south-1.amazonaws.com/prod

vercel env add NEXT_PUBLIC_COGNITO_USER_POOL_ID production
# Enter: YOUR_USER_POOL_ID

vercel env add NEXT_PUBLIC_COGNITO_CLIENT_ID production
# Enter: YOUR_CLIENT_ID

vercel env add NEXT_PUBLIC_COGNITO_REGION production
# Enter: ap-south-1

# Redeploy with environment variables
vercel --prod
```

**✅ Checkpoint:** Frontend is live on Vercel

---

## **Step 6: Update CORS Origins**

Update Lambda environment to allow your Vercel domain:

```bash
# Get your Vercel URL (e.g., https://atelier-onboarding-git-main-mailamiton.vercel.app)

# Update Lambda CORS
aws lambda update-function-configuration \
  --function-name atelier-api-prod \
  --environment Variables="{
    DATABASE_URL=postgresql://atelierdb:atelierdb#1019@atelierdb.crceg4sam0zb.ap-south-1.rds.amazonaws.com:5432/atelier_db,
    AWS_COGNITO_USER_POOL_ID=YOUR_USER_POOL_ID,
    AWS_COGNITO_CLIENT_ID=YOUR_CLIENT_ID,
    AWS_COGNITO_REGION=ap-south-1,
    SMTP_HOST=smtp.gmail.com,
    SMTP_PORT=587,
    SMTP_USER=your-email@gmail.com,
    SMTP_PASSWORD=your-gmail-app-password,
    FROM_EMAIL=noreply@ashishpatelatelier.com,
    ENVIRONMENT=production,
    CORS_ORIGINS=https://your-actual-vercel-url.vercel.app
  }" \
  --region ap-south-1
```

---

## **Step 7: Test Complete System**

### 7.1 Test Frontend

1. Visit your Vercel URL
2. Test registration form at `/register`
3. Submit a test registration
4. Check email for confirmation

### 7.2 Test Admin Dashboard

1. Go to `/admin/login`
2. Login with admin credentials:
   - Email: `admin@ashishpatelatelier.com`
   - Password: `YourSecurePassword123!`
3. View dashboard and registrations

### 7.3 Test API Endpoints

```bash
# List registrations (requires authentication)
curl https://YOUR_API_ID.execute-api.ap-south-1.amazonaws.com/prod/api/registrations

# Health check
curl https://YOUR_API_ID.execute-api.ap-south-1.amazonaws.com/prod/health
```

---

## **Step 8: Monitor & Troubleshoot**

### View Lambda Logs

```bash
# Stream logs in real-time
aws logs tail /aws/lambda/atelier-api-prod --follow --region ap-south-1

# Get recent errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/atelier-api-prod \
  --filter-pattern "ERROR" \
  --region ap-south-1
```

### View Vercel Logs

```bash
vercel logs YOUR_DEPLOYMENT_URL
```

### Common Issues

| Issue | Solution |
|-------|----------|
| CORS errors | Update `CORS_ORIGINS` in Lambda env vars |
| Auth fails | Verify Cognito User Pool ID and Client ID |
| Database errors | Check RDS security group allows Lambda access |
| Email not sending | Verify Gmail App Password is correct |

---

## **📝 Deployment Summary**

Your deployment includes:

- ✅ **Authentication:** AWS Cognito User Pool
- ✅ **Database:** AWS RDS PostgreSQL (atelierdb.crceg4sam0zb.ap-south-1.rds.amazonaws.com)
- ✅ **Backend API:** AWS Lambda + API Gateway
- ✅ **Frontend:** Vercel (Next.js)
- ✅ **Email:** Gmail SMTP

### Important URLs

- **Frontend:** https://your-project.vercel.app
- **API:** https://YOUR_API_ID.execute-api.ap-south-1.amazonaws.com/prod
- **Admin Login:** https://your-project.vercel.app/admin/login

---

## **🔄 Future Updates**

### Update Backend Code

```bash
cd ~/atelier-onboarding/APIS
git pull origin main
./package-lambda.sh
aws lambda update-function-code \
  --function-name atelier-api-prod \
  --zip-file fileb://lambda-deployment.zip \
  --region ap-south-1
```

### Update Frontend Code

```bash
# Vercel auto-deploys on git push
git push origin main

# Or manual deploy
cd UI && vercel --prod
```

---

**🎉 Congratulations!** Your application is now fully deployed and ready for production use.
