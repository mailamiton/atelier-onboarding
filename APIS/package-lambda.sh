#!/bin/bash
# Lambda Deployment Package Builder
# This script creates a deployment package for AWS Lambda

set -e  # Exit on error

echo "🚀 Starting Lambda deployment package creation..."

# Clean up old deployment artifacts
echo "🧹 Cleaning up old deployment artifacts..."
rm -rf deployment/
rm -f lambda-deployment.zip

# Create deployment directory
echo "📁 Creating deployment directory..."
mkdir -p deployment

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt -t deployment/

# Copy application code
echo "📋 Copying application code..."
cp -r app deployment/
cp lambda_function.py deployment/

# Create deployment ZIP
echo "🗜️  Creating deployment ZIP..."
cd deployment
zip -r ../lambda-deployment.zip . -q
cd ..

# Get ZIP size
ZIP_SIZE=$(du -h lambda-deployment.zip | cut -f1)

echo ""
echo "✅ Deployment package created successfully!"
echo "📦 Package: lambda-deployment.zip"
echo "📏 Size: $ZIP_SIZE"
echo ""
echo "📤 Next steps:"
echo "   1. Deploy to AWS Lambda using AWS CLI or Console"
echo "   2. Or use: aws lambda update-function-code --function-name atelier-api --zip-file fileb://lambda-deployment.zip"
echo ""
