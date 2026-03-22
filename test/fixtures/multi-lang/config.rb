#!/usr/bin/env ruby
# Ruby configuration file

# Database configuration
DATABASE_URL = ENV['DATABASE_URL']
DB_POOL_SIZE = ENV['DB_POOL_SIZE']&.to_i || 10

# API configuration
API_KEY = ENV['API_KEY']
API_SECRET = ENV.fetch('API_SECRET', nil)
API_ENDPOINT = ENV.fetch('API_ENDPOINT', 'https://default.api.com')

# Redis configuration
REDIS_HOST = ENV['REDIS_HOST']
REDIS_PORT = ENV['REDIS_PORT']&.to_i || 6379
REDIS_PASSWORD = ENV['REDIS_PASSWORD']

# Application settings
NODE_ENV = ENV['NODE_ENV'] || 'development'
PORT = ENV['PORT']&.to_i || 3000
LOG_LEVEL = ENV.fetch('LOG_LEVEL', 'info')

# Feature flags
ENABLE_CACHING = ENV['ENABLE_CACHING'] == 'true'
ENABLE_ANALYTICS = ENV.fetch('ENABLE_ANALYTICS', 'false') == 'true'

# AWS configuration
AWS_REGION = ENV['AWS_REGION']
AWS_ACCESS_KEY_ID = ENV['AWS_ACCESS_KEY_ID']
AWS_SECRET_ACCESS_KEY = ENV['AWS_SECRET_ACCESS_KEY']

# SMTP configuration
SMTP_HOST = ENV['SMTP_HOST']
SMTP_PORT = ENV['SMTP_PORT']&.to_i
SMTP_USER = ENV['SMTP_USER']
SMTP_PASSWORD = ENV['SMTP_PASSWORD']

# Missing variables (not in .env.example)
ROLLBAR_TOKEN = ENV['ROLLBAR_TOKEN']
BUGSNAG_API_KEY = ENV.fetch('BUGSNAG_API_KEY', nil)

class AppConfig
  def initialize
    @database_url = ENV['DATABASE_URL']
    @api_key = ENV['API_KEY']
    @port = ENV['PORT']&.to_i || 3000
  end
  
  def self.load
    {
      database: ENV['DATABASE_URL'],
      redis: ENV['REDIS_HOST'],
      api_key: ENV['API_KEY']
    }
  end
end
