# Atelier Registration & Admin System

A comprehensive registration and admin system for booking demo art classes at Ashish Patel Atelier. Built with Next.js, FastAPI, AWS Cognito, and PostgreSQL.

## 🏗️ Architecture

```
┌─────────────────┐
│  User Browser   │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│  Next.js (Vercel)│
│  • User UI      │
│  • Admin UI     │
└────────┬────────┘
         │ JWT Auth
         ▼
┌─────────────────┐
│ AWS API Gateway │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AWS Lambda     │
│  (FastAPI)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PostgreSQL     │
│  (AWS RDS)      │
└─────────────────┘
```

## 📁 Project Structure

```
atelier-onboarding/
├── UI/                          # Next.js Frontend
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   │   ├── page.tsx        # Home page
│   │   │   ├── register/       # Registration section
│   │   │   └── admin/          # Admin dashboard
│   │   ├── components/         # Reusable components
│   │   └── lib/               # Utilities & API client
│   ├── package.json
│   └── next.config.js
│
└── atelier-onboarding-api/      # FastAPI Backend
    ├── app/
    │   ├── main.py             # FastAPI app
    │   ├── models.py           # Database models
    │   ├── schemas.py          # Pydantic schemas
    │   ├── config.py           # Configuration
    │   ├── auth.py             # Authentication
    │   ├── routers/            # API routes
    │   └── services/           # Business logic
    ├── requirements.txt
    └── lambda_function.py      # AWS Lambda handler
```

## 🚀 Features

### User Section
- ✅ Modern, responsive registration form
- ✅ Student and parent information collection
- ✅ Experience level and interests selection
- ✅ Preferred time slot booking
- ✅ Email confirmation notifications
- ✅ Success page with next steps

### Admin Section
- ✅ Secure admin authentication (AWS Cognito)
- ✅ Dashboard with key statistics
- ✅ Registration management interface
- ✅ Search and filter capabilities
- ✅ Teacher assignment workflow
- ✅ Demo link generation and sending
- ✅ Status tracking (pending → assigned → link sent → completed)

### Backend Features
- ✅ RESTful API with FastAPI
- ✅ PostgreSQL database with SQLAlchemy ORM
- ✅ JWT-based authentication
- ✅ Email notifications (registration confirmation, teacher assignment)
- ✅ AWS Lambda-ready with Mangum
- ✅ CORS configuration
- ✅ Request validation with Pydantic

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: Custom components with Lucide icons
- **Form Handling**: React Hook Form + Zod validation
- **HTTP Client**: Axios
- **Notifications**: Sonner (toast notifications)
- **Authentication**: AWS Cognito + amazon-cognito-identity-js

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.9+
- **ORM**: SQLAlchemy
- **Database**: PostgreSQL
- **Migration**: Alembic
- **Authentication**: JWT + AWS Cognito
- **AWS Integration**: Boto3
- **Lambda Adapter**: Mangum
- **Email**: SMTP (Gmail/custom)

### Infrastructure
- **Frontend Hosting**: Vercel
- **Backend**: AWS Lambda + API Gateway
- **Database**: AWS RDS (PostgreSQL)
- **Authentication**: AWS Cognito
- **Region**: us-east-1 (configurable)

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.9+
- PostgreSQL 13+
- AWS Account (for Cognito, Lambda, RDS)
- SMTP credentials for email notifications

### Frontend Setup

```bash
cd UI
npm install

# Create .env.local file
cp .env.local.example .env.local

# Update .env.local with your configuration
# NEXT_PUBLIC_API_URL=your-api-gateway-url
# NEXT_PUBLIC_COGNITO_USER_POOL_ID=your-user-pool-id
# NEXT_PUBLIC_COGNITO_CLIENT_ID=your-client-id

# Run development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Backend Setup

```bash
cd atelier-onboarding-api

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Update .env with your configuration
# DATABASE_URL=postgresql://user:password@localhost:5432/atelier_db
# AWS_COGNITO_USER_POOL_ID=your-user-pool-id
# SMTP_USER=your-email@gmail.com
# etc.

# Create database
createdb atelier_db

# Run migrations
alembic upgrade head

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
API documentation: `http://localhost:8000/api/docs`

## 🔐 AWS Cognito Setup

1. **Create User Pool**
   ```bash
   aws cognito-idp create-user-pool \
     --pool-name atelier-users \
     --policies "PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true}" \
     --auto-verified-attributes email
   ```

2. **Create App Client**
   ```bash
   aws cognito-idp create-user-pool-client \
     --user-pool-id YOUR_USER_POOL_ID \
     --client-name atelier-web-client \
     --no-generate-secret
   ```

3. **Update environment variables** with User Pool ID and Client ID

## 🚀 Deployment

### Frontend (Vercel)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd UI
   vercel
   ```

3. **Set Environment Variables** in Vercel Dashboard:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_COGNITO_USER_POOL_ID`
   - `NEXT_PUBLIC_COGNITO_CLIENT_ID`
   - `NEXT_PUBLIC_COGNITO_REGION`

### Backend (AWS Lambda)

1. **Package the application**
   ```bash
   cd atelier-onboarding-api
   pip install -r requirements.txt -t ./package
   cp -r app package/
   cp lambda_function.py package/
   cd package
   zip -r ../lambda_deployment.zip .
   ```

2. **Create Lambda Function**
   ```bash
   aws lambda create-function \
     --function-name atelier-api \
     --runtime python3.9 \
     --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
     --handler lambda_function.lambda_handler \
     --zip-file fileb://../lambda_deployment.zip \
     --timeout 30 \
     --memory-size 512
   ```

3. **Set Environment Variables**
   ```bash
   aws lambda update-function-configuration \
     --function-name atelier-api \
     --environment Variables="{DATABASE_URL=your-rds-url,AWS_COGNITO_USER_POOL_ID=your-pool-id,...}"
   ```

4. **Create API Gateway**
   - Create REST API
   - Create resource and ANY method
   - Set integration to Lambda function
   - Enable CORS
   - Deploy to stage

### Database (AWS RDS)

1. **Create PostgreSQL instance**
   ```bash
   aws rds create-db-instance \
     --db-instance-identifier atelier-db \
     --db-instance-class db.t3.micro \
     --engine postgres \
     --master-username admin \
     --master-user-password YOUR_PASSWORD \
     --allocated-storage 20
   ```

2. **Run migrations**
   ```bash
   # Connect to RDS and run
   alembic upgrade head
   ```

## 📝 API Endpoints

### Public Endpoints
- `POST /api/registrations` - Create registration
- `GET /` - API info
- `GET /health` - Health check

### Protected Endpoints (Admin)
- `GET /api/registrations` - List all registrations
- `GET /api/registrations/{id}` - Get registration details
- `PUT /api/registrations/{id}` - Update registration
- `POST /api/registrations/{id}/assign` - Assign teacher
- `POST /api/registrations/{id}/send-link` - Send demo link
- `GET /api/teachers` - List teachers
- `POST /api/teachers` - Create teacher
- `GET /api/admin/stats` - Dashboard statistics

## 🔒 Security

- JWT-based authentication with AWS Cognito
- HTTPS only in production
- CORS configured for specific origins
- SQL injection protection via SQLAlchemy ORM
- Input validation with Pydantic
- Password requirements enforced
- Environment variables for secrets

## 📧 Email Notifications

The system sends automated emails for:
1. **Registration Confirmation** - Sent immediately after registration
2. **Teacher Assignment** - Sent when teacher is assigned with demo link

Configure SMTP settings in `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@ashishpatelatelier.com
```

## 🧪 Testing

### Frontend
```bash
cd UI
npm run test
```

### Backend
```bash
cd atelier-onboarding-api
pytest
```

## 📊 Database Schema

**Registrations**
- id, student_name, student_age, grade
- parent_name, email, phone
- preferred_time, experience_level, interests
- status, teacher_id, demo_link
- created_at, updated_at

**Teachers**
- id, name, email, phone
- specialization, bio, experience_years
- availability
- created_at, updated_at

**Notifications**
- id, registration_id, recipient_email
- subject, body, status
- sent_at, created_at

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is proprietary software for Ashish Patel Atelier.

## 📞 Support

For issues or questions, contact: support@ashishpatelatelier.com

---

Built with ❤️ for Ashish Patel Atelier
