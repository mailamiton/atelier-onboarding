#!/bin/bash
# Quick setup script for local development environment variables

echo "🔧 Setting up environment variables for local development..."

# Frontend environment
cat > UI/.env.local << 'EOF'
# Backend API (localhost for local development)
NEXT_PUBLIC_API_URL=http://localhost:8000

# AWS Cognito (use placeholder for local dev without Cognito)
# For production, replace with real Cognito credentials
NEXT_PUBLIC_COGNITO_USER_POOL_ID=local-dev-pool
NEXT_PUBLIC_COGNITO_CLIENT_ID=local-dev-client
NEXT_PUBLIC_COGNITO_REGION=us-east-1
EOF

echo "✅ Created UI/.env.local"

# Backend environment
cat > APIS/.env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/atelier_db

# AWS Cognito Configuration (use placeholder for local dev)
# For production, replace with real Cognito credentials
AWS_REGION=us-east-1
AWS_COGNITO_USER_POOL_ID=local-dev-pool
AWS_COGNITO_CLIENT_ID=local-dev-client
AWS_COGNITO_REGION=us-east-1

# Email Configuration (for local testing, use MailHog or real SMTP)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
FROM_EMAIL=noreply@ashishpatelatelier.com

# Application Configuration
ENVIRONMENT=development
DEBUG=True
CORS_ORIGINS=http://localhost:3000
EOF

echo "✅ Created APIS/.env"

echo ""
echo "📝 Environment files created with placeholder values."
echo ""
echo "⚠️  For Vercel production deployment:"
echo "   1. Go to https://vercel.com/dashboard"
echo "   2. Select your project"
echo "   3. Go to Settings → Environment Variables"
echo "   4. Add these variables:"
echo "      - NEXT_PUBLIC_API_URL"
echo "      - NEXT_PUBLIC_COGNITO_USER_POOL_ID"
echo "      - NEXT_PUBLIC_COGNITO_CLIENT_ID"
echo "      - NEXT_PUBLIC_COGNITO_REGION"
echo ""
echo "⚠️  For AWS Cognito setup, see DEPLOYMENT.md"
echo ""
echo "✅ Done! You can now run the application locally."
