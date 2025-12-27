# Atelier Backend API - FastAPI Application

RESTful API for managing student registrations and demo class bookings.

## 🏗️ Architecture

- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: AWS Cognito + JWT
- **Deployment**: AWS Lambda + API Gateway (via Mangum)
- **Migrations**: Alembic

## 🚀 Quick Start

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Create database
createdb atelier_db

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload
```

API docs: http://localhost:8000/api/docs

## 📁 Project Structure

```
atelier-onboarding-api/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration management
│   ├── database.py          # Database setup
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── auth.py              # Authentication logic
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── registrations.py # Registration endpoints
│   │   ├── teachers.py      # Teacher endpoints
│   │   └── admin.py         # Admin endpoints
│   └── services/
│       ├── __init__.py
│       └── email_service.py # Email notifications
├── alembic/                 # Database migrations
├── requirements.txt         # Python dependencies
├── .env.example            # Environment template
├── alembic.ini             # Alembic configuration
└── lambda_function.py      # AWS Lambda handler
```

## 📝 API Endpoints

### Public Endpoints

#### Registration
```http
POST /api/registrations
Content-Type: application/json

{
  "student_name": "John Doe",
  "student_age": 12,
  "grade": "7",
  "parent_name": "Jane Doe",
  "email": "parent@example.com",
  "phone": "+1234567890",
  "preferred_time": "Morning (8 AM - 12 PM)",
  "experience_level": "beginner",
  "interests": ["Drawing", "Painting"],
  "additional_notes": "Excited to learn!"
}
```

### Protected Endpoints (Admin Only)

#### List Registrations
```http
GET /api/registrations?status=pending&search=john
Authorization: Bearer <JWT_TOKEN>
```

#### Get Registration
```http
GET /api/registrations/{registration_id}
Authorization: Bearer <JWT_TOKEN>
```

#### Update Registration
```http
PUT /api/registrations/{registration_id}
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "status": "teacher_assigned"
}
```

#### Assign Teacher
```http
POST /api/registrations/{registration_id}/assign
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "teacher_id": "teacher-uuid"
}
```

#### Send Demo Link
```http
POST /api/registrations/{registration_id}/send-link
Authorization: Bearer <JWT_TOKEN>
```

#### List Teachers
```http
GET /api/teachers
Authorization: Bearer <JWT_TOKEN>
```

#### Create Teacher
```http
POST /api/teachers
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "Ashish Patel",
  "email": "ashish@example.com",
  "phone": "+1234567890",
  "specialization": "Renaissance Art",
  "bio": "Ex-faculty at Angel Academy of Art, Florence",
  "experience_years": 15,
  "availability": "Mon-Fri, 9 AM - 5 PM"
}
```

#### Dashboard Statistics
```http
GET /api/admin/stats
Authorization: Bearer <JWT_TOKEN>
```

Response:
```json
{
  "total_registrations": 150,
  "pending_assignments": 12,
  "teachers_assigned": 85,
  "completed_demos": 53
}
```

## 🗄️ Database Models

### Registration
```python
class Registration(Base):
    id: str (UUID)
    student_name: str
    student_age: int
    grade: str
    parent_name: str
    email: str
    phone: str
    preferred_time: str (optional)
    experience_level: ExperienceLevel (enum)
    interests: List[str]
    additional_notes: str (optional)
    status: RegistrationStatus (enum)
    teacher_id: str (foreign key)
    demo_link: str (optional)
    demo_scheduled_at: datetime (optional)
    created_at: datetime
    updated_at: datetime
```

### Teacher
```python
class Teacher(Base):
    id: str (UUID)
    name: str
    email: str
    phone: str (optional)
    specialization: str (optional)
    bio: str (optional)
    experience_years: int (optional)
    availability: str (optional)
    created_at: datetime
    updated_at: datetime
```

### Notification
```python
class Notification(Base):
    id: str (UUID)
    registration_id: str (foreign key)
    recipient_email: str
    subject: str
    body: str
    sent_at: datetime (optional)
    status: str
    error_message: str (optional)
    created_at: datetime
```

## 🔐 Authentication

### AWS Cognito Integration

1. **Login Flow**:
   - Frontend sends credentials to Cognito
   - Cognito returns JWT token
   - Token stored in frontend
   - Token sent in Authorization header

2. **Token Verification**:
   ```python
   from app.auth import require_admin
   
   @router.get("/protected")
   async def protected_route(current_user: dict = Depends(require_admin)):
       return {"user": current_user}
   ```

3. **Token Format**:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## 📧 Email Service

### Configuration
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@ashishpatelatelier.com
```

### Email Templates

1. **Registration Confirmation**
   - Sent immediately after registration
   - Contains next steps information

2. **Teacher Assignment Notification**
   - Sent when teacher is assigned
   - Includes teacher details and demo link

## 🔄 Database Migrations

### Create Migration
```bash
alembic revision --autogenerate -m "description"
```

### Run Migrations
```bash
alembic upgrade head
```

### Rollback
```bash
alembic downgrade -1
```

## 🚀 AWS Lambda Deployment

### Package Application
```bash
# Install dependencies in package folder
pip install -r requirements.txt -t ./package

# Copy application files
cp -r app package/
cp lambda_function.py package/

# Create ZIP
cd package
zip -r ../lambda_deployment.zip .
```

### Deploy to Lambda
```bash
aws lambda update-function-code \
  --function-name atelier-api \
  --zip-file fileb://lambda_deployment.zip
```

### Environment Variables
Set in Lambda console or via CLI:
- `DATABASE_URL`
- `AWS_COGNITO_USER_POOL_ID`
- `AWS_COGNITO_CLIENT_ID`
- `JWT_SECRET_KEY`
- `SMTP_*` variables

## 🧪 Testing

### Run Tests
```bash
pytest
```

### Test Coverage
```bash
pytest --cov=app tests/
```

### Manual Testing
Use the interactive API docs at `/api/docs`

## 📊 Monitoring

### Logs
- FastAPI automatic logging
- CloudWatch logs (in Lambda)
- Custom logging for email service

### Metrics
- Request count
- Response times
- Error rates
- Database query performance

## ⚡ Performance

### Database Optimization
- Connection pooling
- Query optimization
- Indexes on frequently queried fields

### Caching
- Ready for Redis integration
- Response caching for static data

### Rate Limiting
- API Gateway throttling
- Custom rate limiting middleware

## 🔒 Security

- Input validation with Pydantic
- SQL injection prevention (SQLAlchemy)
- CORS configuration
- JWT token validation
- Password hashing (if implementing local auth)
- Environment variable secrets

## 🐛 Debugging

### Enable Debug Mode
```env
DEBUG=True
ENVIRONMENT=development
```

### Database Queries
```python
# Enable SQL logging
import logging
logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
```

## 📦 Dependencies

### Core
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `pydantic` - Data validation
- `sqlalchemy` - ORM
- `psycopg2-binary` - PostgreSQL driver

### AWS & Auth
- `mangum` - AWS Lambda adapter
- `boto3` - AWS SDK
- `python-jose` - JWT handling

### Utilities
- `alembic` - Migrations
- `python-dotenv` - Environment variables
- `requests` - HTTP requests

---

For frontend documentation, see UI/README.md
For overall project documentation, see main README.md
