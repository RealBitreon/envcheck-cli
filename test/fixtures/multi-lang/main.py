#!/usr/bin/env python3
"""Python application using environment variables"""

import os
from typing import Optional

# Database configuration
DATABASE_URL = os.environ['DATABASE_URL']
DB_POOL_SIZE = int(os.getenv('DB_POOL_SIZE', '10'))

# API configuration
API_KEY = os.environ.get('API_KEY')
API_SECRET = os.getenv('API_SECRET')
API_ENDPOINT = os.environ.get('API_ENDPOINT', 'https://default.api.com')

# Redis configuration
REDIS_HOST = os.environ['REDIS_HOST']
REDIS_PORT = int(os.getenv('REDIS_PORT', '6379'))
REDIS_PASSWORD = os.environ.get('REDIS_PASSWORD', '')

# Application settings
NODE_ENV = os.getenv('NODE_ENV', 'development')
PORT = int(os.environ.get('PORT', '3000'))
LOG_LEVEL = os.getenv('LOG_LEVEL', 'info')

# Feature flags
ENABLE_CACHING = os.environ.get('ENABLE_CACHING', 'false').lower() == 'true'
ENABLE_ANALYTICS = os.getenv('ENABLE_ANALYTICS', 'false') == 'true'

# AWS configuration
AWS_REGION = os.environ['AWS_REGION']
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')

# Missing variables (not in .env.example)
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY')
SLACK_WEBHOOK_URL = os.getenv('SLACK_WEBHOOK_URL')

def get_config() -> dict:
    """Get application configuration"""
    return {
        'database_url': DATABASE_URL,
        'api_key': API_KEY,
        'port': PORT
    }
