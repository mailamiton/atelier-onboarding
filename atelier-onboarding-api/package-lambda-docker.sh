#!/bin/bash
# Lambda Deployment Package Builder using Docker
# This ensures 100% compatibility with AWS Lambda runtime

set -e

echo "🐳 Building Lambda deployment package using Docker..."

# Clean up old artifacts
echo "🧹 Cleaning up old deployment artifacts..."
rm -rf deployment/
rm -f lambda-deployment.zip

# Build using AWS Lambda base image
echo "📦 Building dependencies in Lambda-compatible environment..."
docker run --rm \
  -v "$PWD":/var/task \
  public.ecr.aws/lambda/python:3.9 \
  bash -c "
    pip install -r requirements.txt -t /var/task/deployment/ && \
    cp -r /var/task/app /var/task/deployment/ && \
    cp /var/task/lambda_function.py /var/task/deployment/
  "

# Create ZIP
echo "🗜️  Creating deployment ZIP..."
cd deployment
zip -r ../lambda-deployment.zip . -q
cd ..

# Get ZIP size
ZIP_SIZE=$(du -h lambda-deployment.zip | cut -f1)

echo ""
echo "✅ Deployment package created successfully using Docker!"
echo "📦 Package: lambda-deployment.zip"
echo "📏 Size: $ZIP_SIZE"
echo ""
echo "📤 Deploy with:"
echo "   aws lambda update-function-code --function-name atelier-api-prod --zip-file fileb://lambda-deployment.zip"
echo ""
