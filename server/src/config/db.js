import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

export const env = {
  PORT: process.env.PORT || 5001,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_eb_connect',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_fallback_secret_change_in_prod_smart_eb_connect',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development'
};

export async function connectDB(uri = env.MONGODB_URI) {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    if (env.NODE_ENV !== 'test') {
      console.log(`[MongoDB] Connected successfully to ${uri}`);
    }
  } catch (error) {
    console.error('[MongoDB] Connection error:', error.message);
    throw error;
  }
}
