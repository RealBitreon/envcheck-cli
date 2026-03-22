// Application configuration loaded from environment variables

export const config = {
  database: {
    url: process.env.DATABASE_URL,
    poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '10', 10),
  },
  
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  
  api: {
    secret: process.env.API_SECRET,
    stripeKey: process.env.STRIPE_KEY,
  },
  
  app: {
    env: process.env.NODE_ENV,
    port: parseInt(process.env.PORT || '3000', 10),
    logLevel: process.env.LOG_LEVEL,
  },
  
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
  },
  
  features: {
    analytics: process.env.ENABLE_ANALYTICS === 'true',
    cache: process.env.ENABLE_CACHE === 'true',
  },
};
