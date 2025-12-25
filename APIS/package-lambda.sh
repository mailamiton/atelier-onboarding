#!/bin/bash
# Lambda Deployment Package Builder
# This script creates a deployment package for AWS Lambda

set -e  # Exit on error

echo "🚀 Starting Lambda deployment package creation..."

# Check if zip is installed
if ! command -v zip &> /dev/null; then
    echo "⚠️  'zip' command not found. Installing..."
    sudo apt-get update -qq && sudo apt-get install -y zip
fi

# Clean up old deployment artifacts
echo "🧹 Cleaning up old deployment artifacts..."
rm -rf deployment/
rm -f lambda-deployment.zip

# Create deployment directory
echo "📁 Creating deployment directory..."
mkdir -p deployment

# Install dependencies for Lambda (Linux x86_64)
echo "📦 Installing Python dependencies for AWS Lambda runtime..."
echo "   (Using platform-specific wheels for manylinux2014_x86_64)"

# Deactivate virtual environment if active (to use system Python)
if [ -n "$VIRTUAL_ENV" ]; then
    echo "   Detected virtual environment, using system Python instead..."
fi

# Install dependencies with platform-specific wheels using python3 module
python3 -m pip install \
    --platform manylinux2014_x86_64 \
    --target deployment/ \
    --implementation cp \
    --python-version 3.9 \
    --only-binary=:all: \
    --upgrade \
    -r requirements.txt

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
