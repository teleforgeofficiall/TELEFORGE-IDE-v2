import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '..', '.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
  databasePath: process.env.DATABASE_PATH || './data/freecode.db',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },
  freemodel: {
    anthropicBaseUrl: 'https://cc.freemodel.dev/v1',
    openaiBaseUrl: 'https://api.freemodel.dev/v1',
  },
  freeCredits: 50,
  proPrice: 29900,
  creditCostPerRequest: 1,
};
