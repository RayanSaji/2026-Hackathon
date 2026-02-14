#!/bin/bash
# BudgetU Lambda Deployment Script
# Usage: ./deploy.sh [lambda-function-name] [region]

FUNCTION_NAME="${1:-budgetu-api}"
REGION="${2:-us-east-1}"

set -e

echo "=== BudgetU Lambda Deployment ==="

# 1. Install dependencies
echo "Installing dependencies..."
npm install --omit=dev

# 2. Create deployment zip
echo "Creating deployment package..."
rm -f function.zip
zip -r function.zip index.mjs lib/ node_modules/

# 3. Deploy to Lambda
echo "Deploying to Lambda function: $FUNCTION_NAME in $REGION..."
aws lambda update-function-code \
  --function-name "$FUNCTION_NAME" \
  --zip-file fileb://function.zip \
  --region "$REGION"

echo ""
echo "=== Deployment complete ==="
echo ""
echo "Don't forget to set environment variables on the Lambda:"
echo "  SUPABASE_URL          = your Supabase project URL"
echo "  SUPABASE_SERVICE_ROLE_KEY = your Supabase service_role key"
echo "  ALLOWED_ORIGIN        = your frontend domain (or * for dev)"
