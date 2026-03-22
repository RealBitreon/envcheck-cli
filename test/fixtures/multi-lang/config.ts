// TypeScript configuration file
interface DatabaseConfig {
  url: string;
  poolSize: number;
}

interface ApiConfig {
  key: string;
  secret: string;
  endpoint: string;
}

// Database configuration
export const dbConfig: DatabaseConfig = {
  url: process.env.DATABASE_URL!,
  poolSize: parseInt(process.env.DB_POOL_SIZE || '10', 10)
};

// API configuration
export const apiConfig: ApiConfig = {
  key: process.env.API_KEY!,
  secret: process.env.API_SECRET!,
  endpoint: process.env.API_ENDPOINT || 'https://default.api.com'
};

// Vite/import.meta.env usage
export const viteConfig = {
  apiUrl: import.meta.env.VITE_API_URL,
  publicKey: import.meta.env.VITE_PUBLIC_KEY
};

// Missing variables
const stripeKey = process.env.STRIPE_KEY;
const twilioSid = process.env.TWILIO_SID;

export default {
  db: dbConfig,
  api: apiConfig
};
