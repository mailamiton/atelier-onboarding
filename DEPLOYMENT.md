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

## 💻 **Local Development Setup**

Complete guide for running the application locally for development and testing.

### Prerequisites for Local Development
- Node.js v18+ and npm v9+
- Python 3.9+ with pip
- PostgreSQL client (psql)
- SSH access to bastion host
- `.pem` key file for SSH tunnel

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/mailamiton/atelier-onboarding.git
cd atelier-onboarding
```

### Step 2: Setup SSH Tunnel to RDS Database

The database is hosted on AWS RDS and requires an SSH tunnel through the bastion host.

```bash
# Navigate to project root
cd /home/amit/Document/Non-Official/atelier/atelier-onboarding

# Start SSH tunnel (keep this terminal open)
ssh -i bastion.pem -L 5433:atelierdb.crceg4sam0zb.ap-south-1.rds.amazonaws.com:5432 ubuntu@13.203.218.48 -N

# This command forwards:
# - Local port 5433 → RDS database port 5432
# - Through bastion host at 13.203.218.48
```

**Important:** Keep this terminal window open while developing. The tunnel must stay active for the backend to connect to the database.

### Step 3: Setup Backend API

Open a new terminal window:

```bash
# Navigate to backend directory
cd /home/amit/Document/Non-Official/atelier/atelier-onboarding/atelier-onboarding-api

# Create Python virtual environment (first time only)
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Create .env.tunnel file (if not exists)
cat > .env.tunnel << 'EOF'
# Database Configuration (via SSH tunnel)
DATABASE_URL=postgresql://atelierdb:atelierdb#1019@localhost:5433/atelier_db

# AWS Cognito Configuration
AWS_COGNITO_USER_POOL_ID=ap-south-1_gzMEp3vBW
AWS_COGNITO_CLIENT_ID=5nqa0ngnbhk791p8psg7vk6lsr
AWS_COGNITO_REGION=ap-south-1

# Email Configuration (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@ashishpatelatelier.com

# Application Configuration
ENVIRONMENT=development
DEBUG=True
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
EOF

# Load environment variables
export $(grep -v '^#' .env.tunnel | xargs)

# Run database migrations (first time only)
alembic upgrade head

# Start the backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Server will start at: http://localhost:8000
# API docs available at: http://localhost:8000/docs
```

### Step 4: Setup Frontend UI

Open a new terminal window:

```bash
# Navigate to frontend directory
cd /home/amit/Document/Non-Official/atelier/atelier-onboarding/UI

# Install dependencies (first time only)
npm install

# Create .env file (if not exists)
cat > .env << 'EOF'
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# AWS Cognito Configuration
NEXT_PUBLIC_COGNITO_USER_POOL_ID=ap-south-1_gzMEp3vBW
NEXT_PUBLIC_COGNITO_CLIENT_ID=5nqa0ngnbhk791p8psg7vk6lsr
NEXT_PUBLIC_COGNITO_REGION=ap-south-1
EOF

# Start the development server
npm run dev

# Frontend will start at: http://localhost:3000
```

### Step 5: Access the Application

Your local application is now running:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **Admin Login:** http://localhost:3000/admin/login
- **Registration Page:** http://localhost:3000/register

### Admin Credentials

```
Email: rentbuyart@gmail.com
Password: Abhinav@1019
```

### Quick Start Script (All-in-One)

Create a script to start everything:

```bash
#!/bin/bash
# save as: start-local.sh

# Start SSH tunnel in background
ssh -i bastion.pem -L 5433:atelierdb.crceg4sam0zb.ap-south-1.rds.amazonaws.com:5432 ubuntu@13.203.218.48 -N &
SSH_PID=$!

# Wait for tunnel
sleep 2

# Start backend
cd atelier-onboarding-api
source .venv/bin/activate
export $(grep -v '^#' .env.tunnel | xargs)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start frontend
cd ../UI
npm run dev &
FRONTEND_PID=$!

echo "✅ All services started!"
echo "- SSH Tunnel PID: $SSH_PID"
echo "- Backend PID: $BACKEND_PID"
echo "- Frontend PID: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "kill $SSH_PID $BACKEND_PID $FRONTEND_PID" EXIT
wait
```

### Stopping Services

```bash
# Kill all processes
pkill -f "ssh.*5433"
pkill -f "uvicorn"
pkill -f "next dev"

# Or if using the script above, just press Ctrl+C
```

### Common Local Development Commands

```bash
# Check if SSH tunnel is running
ps aux | grep "ssh.*5433"

# Check if backend is running
ps aux | grep uvicorn

# Check if frontend is running
ps aux | grep "next dev"

# Test database connection
psql postgresql://atelierdb:atelierdb#1019@localhost:5433/atelier_db -c "SELECT 1"

# Test backend API
curl http://localhost:8000/health

# View backend logs (if running in background)
tail -f atelier-onboarding-api/logs/*.log

# Restart backend only
cd atelier-onboarding-api
source .venv/bin/activate
export $(grep -v '^#' .env.tunnel | xargs)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Database Access (Local)

```bash
# Connect via SSH tunnel
psql postgresql://atelierdb:atelierdb#1019@localhost:5433/atelier_db

# List tables
\dt

# View registrations
SELECT * FROM registrations;

# View teachers
SELECT * FROM teachers;

# Exit
\q
```

### Troubleshooting Local Setup

| Issue | Solution |
|-------|----------|
| Port 5433 already in use | Kill existing tunnel: `pkill -f "ssh.*5433"` |
| Port 8000 already in use | Kill backend: `pkill -f uvicorn` |
| Port 3000 already in use | Kill frontend: `pkill -f "next dev"` |
| Database connection fails | Check SSH tunnel is running |
| Backend 403 errors | Ensure `ENVIRONMENT=development` in `.env.tunnel` |
| Frontend can't reach backend | Verify `NEXT_PUBLIC_API_URL=http://localhost:8000` |

---

## 🚀 **Production Deployment Steps**

Follow these steps in order for production deployment:

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
  --user-pool-id ap-south-1_gzMEp3vBW \
  --client-name atelier-web-client \
  --no-generate-secret \
  --explicit-auth-flows ADMIN_NO_SRP_AUTH USER_PASSWORD_AUTH \
  --read-attributes email name \
  --write-attributes email name \
  --region ap-south-1

# ✅ SAVE THIS: Copy the ClientId from output
```

### 1.3 Create Admins Group
```bash
# Create Admins group for administrative access
aws cognito-idp create-group \
  --group-name Admins \
  --user-pool-id ap-south-1_gzMEp3vBW \
  --description "Administrator group with full access" \
  --region ap-south-1

# ✅ SAVE THIS: Admins group created
```

### 1.4 Create Admin User and Add to Group
```bash
# Create admin user with verified email
aws cognito-idp admin-create-user \
  --user-pool-id ap-south-1_gzMEp3vBW \
  --username rentbuyart@gmail.com \
  --user-attributes \
    Name=email,Value=rentbuyart@gmail.com \
    Name=email_verified,Value=true \
    Name=name,Value="Admin User" \
  --temporary-password TempPass123! \
  --message-action SUPPRESS \
  --region ap-south-1

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id ap-south-1_gzMEp3vBW \
  --username rentbuyart@gmail.com \
  --password YourSecurePassword123! \
  --permanent \
  --region ap-south-1

# Add user to Admins group (REQUIRED for admin access)
aws cognito-idp admin-add-user-to-group \
  --user-pool-id ap-south-1_gzMEp3vBW \
  --username rentbuyart@gmail.com \
  --group-name Admins \
  --region ap-south-1

# ✅ IMPORTANT: Users MUST be in the Admins group to access admin endpoints
```

**✅ Checkpoint:** You now have:
- User Pool ID - ap-south-1_gzMEp3vBW
- Client ID - 5nqa0ngnbhk791p8psg7vk6lsr
- Admins group created
- Admin user credentials - rentbuyart@gmail.com/Abhinav@1019
- User added to Admins group

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
cd ~/atelier-onboarding/atelier-onboarding-api

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
  --role-name atelier-onboarding-api-role \
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
  --role-name atelier-onboarding-api-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Attach VPC access policy (required for RDS access)
aws iam attach-role-policy \
  --role-name atelier-onboarding-api-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole

# Attach Cognito access policy
aws iam attach-role-policy \
  --role-name atelier-onboarding-api-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonCognitoPowerUser

# Wait 10 seconds for IAM propagation
sleep 10
```

### 3.2 Package Lambda Deployment

```bash
cd ~/atelier-onboarding/atelier-onboarding-api

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
  --function-name atelier-onboarding \
  --runtime python3.9 \
  --role arn:aws:iam::841493805509:role/atelier-onboarding-api-role \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://lambda-deployment.zip \
  --timeout 30 \
  --memory-size 512 \
  --region ap-south-1 \
  --environment Variables="{
    DATABASE_URL=postgresql://atelierdb:atelierdb#1019@atelierdb.crceg4sam0zb.ap-south-1.rds.amazonaws.com:5432/atelier_db,
    AWS_COGNITO_USER_POOL_ID=ap-south-1_gzMEp3vBW,
    AWS_COGNITO_CLIENT_ID=5nqa0ngnbhk791p8psg7vk6lsr,
    AWS_COGNITO_REGION=ap-south-1,
    SMTP_HOST=smtp.gmail.com,
    SMTP_PORT=587,
    SMTP_USER=rentbuyart@gmail.com,
    SMTP_PASSWORD=Abhinav@,
    FROM_EMAIL=rentbuyart@gmail.com,
    ENVIRONMENT=production,
    CORS_ORIGINS=https://on-board.ashishpatelatelier.com,http://localhost:3000
    
  }"
```

### 3.4 Update Lambda Function (Subsequent Deployments)

```bash
# Update code only
aws lambda update-function-code \
  --function-name atelier-onboarding \
  --zip-file fileb://lambda-deployment.zip \
  --region ap-south-1

# Update environment variables
aws lambda update-function-configuration \
  --function-name atelier-onboarding \
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
    CORS_ORIGINS=https://on-board.ashishpatelatelier.com,http://localhost:3000
    
  }"
```

**✅ Checkpoint:** Lambda function is deployed

---

## **Step 4: Setup API Gateway**

### 4.1 Create HTTP API

```bash
# Create HTTP API with Lambda integration
aws apigatewayv2 create-api \
  --name atelier-onboarding \
  --protocol-type HTTP \
  --target arn:aws:lambda:ap-south-1:841493805509:function:atelier-onboarding \
  --region ap-south-1

# ✅ SAVE THIS: Copy the ApiId from output
```
https://ettudadafj.execute-api.ap-south-1.amazonaws.com

### 4.2 Grant API Gateway Permission

```bash
aws lambda add-permission \
  --function-name atelier-onboarding \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:ap-south-1:841493805509:ettudadafj/*/*" \
  --region ap-south-1
```

### 4.3 Create Stage and Get API URL

```bash
# Create production stage
aws apigatewayv2 create-stage \
  --api-id ettudadafj \
  --stage-name prod \
  --auto-deploy \
  --region ap-south-1

# Get your API URL
echo "✅ Your API URL: https://ettudadafj.execute-api.ap-south-1.amazonaws.com/prod"
```

### 4.4 Test API

```bash
# Test health endpoint
curl https://ettudadafj.execute-api.ap-south-1.amazonaws.com

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
  --function-name atelier-onboarding \
  --environment Variables="{
    DATABASE_URL=postgresql://atelierdb:atelierdb#1019@atelierdb.crceg4sam0zb.ap-south-1.rds.amazonaws.com:5432/atelier_db,
    AWS_COGNITO_USER_POOL_ID=ap-south-1_gzMEp3vBW,
    AWS_COGNITO_CLIENT_ID=5nqa0ngnbhk791p8psg7vk6lsr,
    AWS_COGNITO_REGION=ap-south-1,
    SMTP_HOST=smtp.gmail.com,
    SMTP_PORT=587,
    SMTP_USER=rentbuyart@gmail.com,
    SMTP_PASSWORD=YOUR_GMAIL_APP_PASSWORD,
    FROM_EMAIL=rentbuyart@gmail.com,
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
aws logs tail /aws/lambda/atelier-onboarding --follow --region ap-south-1

# Get recent errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/atelier-onboarding \
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
cd ~/atelier-onboarding/atelier-onboarding-api
git pull origin main
./package-lambda.sh
aws lambda update-function-code \
  --function-name atelier-onboarding \
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
--Local DB Access--
ssh -i bastion.pem -L 5433:atelierdb.crceg4sam0zb.ap-south-1.rds.amazonaws.com:5432 ubuntu@13.203.218.48 -N


**🎉 Congratulations!** Your application is now fully deployed and ready for production use.
