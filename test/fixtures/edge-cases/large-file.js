// Large file with many environment variable references
// This simulates a real-world application with extensive configuration

const config = {
  // Database configuration
  database: {
    primary: {
      host: process.env.DB_PRIMARY_HOST,
      port: process.env.DB_PRIMARY_PORT,
      name: process.env.DB_PRIMARY_NAME,
      user: process.env.DB_PRIMARY_USER,
      password: process.env.DB_PRIMARY_PASSWORD,
      ssl: process.env.DB_PRIMARY_SSL === 'true',
      poolMin: parseInt(process.env.DB_PRIMARY_POOL_MIN || '2'),
      poolMax: parseInt(process.env.DB_PRIMARY_POOL_MAX || '10'),
      connectionTimeout: parseInt(process.env.DB_PRIMARY_TIMEOUT || '30000'),
    },
    replica: {
      host: process.env.DB_REPLICA_HOST,
      port: process.env.DB_REPLICA_PORT,
      name: process.env.DB_REPLICA_NAME,
      user: process.env.DB_REPLICA_USER,
      password: process.env.DB_REPLICA_PASSWORD,
      ssl: process.env.DB_REPLICA_SSL === 'true',
    },
    cache: {
      host: process.env.CACHE_HOST,
      port: process.env.CACHE_PORT,
      password: process.env.CACHE_PASSWORD,
      db: parseInt(process.env.CACHE_DB || '0'),
      ttl: parseInt(process.env.CACHE_TTL || '3600'),
    }
  },
  
  // API configuration
  api: {
    internal: {
      baseUrl: process.env.API_INTERNAL_BASE_URL,
      timeout: parseInt(process.env.API_INTERNAL_TIMEOUT || '5000'),
      retries: parseInt(process.env.API_INTERNAL_RETRIES || '3'),
    },
    external: {
      baseUrl: process.env.API_EXTERNAL_BASE_URL,
      apiKey: process.env.API_EXTERNAL_KEY,
      apiSecret: process.env.API_EXTERNAL_SECRET,
      timeout: parseInt(process.env.API_EXTERNAL_TIMEOUT || '10000'),
    },
    payment: {
      stripeKey: process.env.STRIPE_API_KEY,
      stripeSecret: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
    email: {
      sendgridKey: process.env.SENDGRID_API_KEY,
      fromAddress: process.env.EMAIL_FROM_ADDRESS,
      fromName: process.env.EMAIL_FROM_NAME,
    }
  },
  
  // Cloud services
  aws: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3: {
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_S3_REGION,
      endpoint: process.env.AWS_S3_ENDPOINT,
    },
    sqs: {
      queueUrl: process.env.AWS_SQS_QUEUE_URL,
      region: process.env.AWS_SQS_REGION,
    },
    sns: {
      topicArn: process.env.AWS_SNS_TOPIC_ARN,
      region: process.env.AWS_SNS_REGION,
    }
  },
  
  // Monitoring and logging
  monitoring: {
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: process.env.SENTRY_ENVIRONMENT,
      release: process.env.SENTRY_RELEASE,
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    },
    datadog: {
      apiKey: process.env.DATADOG_API_KEY,
      appKey: process.env.DATADOG_APP_KEY,
      site: process.env.DATADOG_SITE,
    },
    newrelic: {
      licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
      appName: process.env.NEW_RELIC_APP_NAME,
    }
  },
  
  // Application settings
  app: {
    name: process.env.APP_NAME,
    version: process.env.APP_VERSION,
    environment: process.env.NODE_ENV,
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || '0.0.0.0',
    baseUrl: process.env.BASE_URL,
    apiPrefix: process.env.API_PREFIX || '/api',
    logLevel: process.env.LOG_LEVEL || 'info',
    logFormat: process.env.LOG_FORMAT || 'json',
  },
  
  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiry: process.env.JWT_EXPIRY || '1h',
    sessionSecret: process.env.SESSION_SECRET,
    sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000'),
    corsOrigin: process.env.CORS_ORIGIN,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'),
  },
  
  // Feature flags
  features: {
    enableCaching: process.env.FEATURE_CACHING === 'true',
    enableAnalytics: process.env.FEATURE_ANALYTICS === 'true',
    enableNotifications: process.env.FEATURE_NOTIFICATIONS === 'true',
    enableBetaFeatures: process.env.FEATURE_BETA === 'true',
    enableDebugMode: process.env.FEATURE_DEBUG === 'true',
    enableMaintenanceMode: process.env.FEATURE_MAINTENANCE === 'true',
  },
  
  // Third-party integrations
  integrations: {
    slack: {
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      channel: process.env.SLACK_CHANNEL,
      botToken: process.env.SLACK_BOT_TOKEN,
    },
    github: {
      token: process.env.GITHUB_TOKEN,
      org: process.env.GITHUB_ORG,
      repo: process.env.GITHUB_REPO,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
    }
  }
};

module.exports = config;
