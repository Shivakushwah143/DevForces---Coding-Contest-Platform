import dotenv from "dotenv";
dotenv.config();

// ==================== CONFIG VALUES ====================
export const CONFIG = {
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:admin@localhost:5433/devforces?schema=public",
  PORT: parseInt(process.env.PORT || "4000"),
  EMAIL_USER: process.env.EMAIL_USER || "shivakushwah144@gmail.com",
  EMAIL_PASS: process.env.EMAIL_PASS || "bhhaiphbziefhkbu", 
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  JWT_SECRET: process.env.JWT_SECRET || "your-secret-key",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "your-refresh-secret",
  EMAIL_JWT_SECRET: process.env.EMAIL_JWT_SECRET || "your-email-jwt-secret",
  EMAIL_HOST: process.env.EMAIL_HOST || "smtp.gmail.com",
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || "587"),
  EMAIL_FROM: process.env.EMAIL_FROM || "shivakushwah144@gmail.com",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5174",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || ""
};

console.log('🚀 Using configuration values');
console.log('📊 DATABASE_URL:', CONFIG.DATABASE_URL);
console.log('🔌 PORT:', CONFIG.PORT);