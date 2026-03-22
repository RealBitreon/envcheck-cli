// JavaScript/Node.js application
const express = require('express');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_SIZE || '10')
});

// API configuration
const apiKey = process.env.API_KEY;
const apiSecret = process.env['API_SECRET'];
const apiEndpoint = process.env.API_ENDPOINT || 'https://default.api.com';

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
};

// Application settings
const app = express();
const port = process.env.PORT || 3000;
const nodeEnv = process.env.NODE_ENV;

// Feature flags
const cachingEnabled = process.env.ENABLE_CACHING === 'true';
const analyticsEnabled = process.env.ENABLE_ANALYTICS === 'true';

// AWS configuration
const awsConfig = {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
};

// Missing variable (not in .env.example)
const jwtSecret = process.env.JWT_SECRET;
const sessionSecret = process.env['SESSION_SECRET'];

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
