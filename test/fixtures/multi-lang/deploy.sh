#!/bin/bash
# Deployment script using environment variables

set -e

# Database configuration
echo "Connecting to database: $DATABASE_URL"
DB_POOL_SIZE=${DB_POOL_SIZE:-10}

# API configuration
if [ -z "$API_KEY" ]; then
  echo "Error: API_KEY is required"
  exit 1
fi

API_SECRET="${API_SECRET}"
API_ENDPOINT="${API_ENDPOINT:-https://default.api.com}"

# Redis configuration
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_PASSWORD="$REDIS_PASSWORD"

# Application settings
NODE_ENV="${NODE_ENV:-development}"
PORT="${PORT:-3000}"
LOG_LEVEL="${LOG_LEVEL:-info}"

# Feature flags
ENABLE_CACHING="${ENABLE_CACHING:-false}"
ENABLE_ANALYTICS="${ENABLE_ANALYTICS:-false}"

# AWS configuration
echo "AWS Region: $AWS_REGION"
echo "AWS Access Key: ${AWS_ACCESS_KEY_ID:0:4}****"
echo "AWS Secret: ${AWS_SECRET_ACCESS_KEY:0:4}****"

# SMTP configuration
SMTP_HOST="$SMTP_HOST"
SMTP_PORT="$SMTP_PORT"
SMTP_USER="$SMTP_USER"
SMTP_PASSWORD="$SMTP_PASSWORD"

# Missing variables (not in .env.example)
DEPLOY_KEY="$DEPLOY_KEY"
BUILD_NUMBER="$BUILD_NUMBER"

# Export for child processes
export DATABASE_URL
export API_KEY
export NODE_ENV
export PORT

echo "Deployment configuration loaded"
echo "Environment: $NODE_ENV"
echo "Port: $PORT"
echo "Log Level: $LOG_LEVEL"
