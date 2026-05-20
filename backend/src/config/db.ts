import mongoose from 'mongoose';
import { env } from './env';

export async function connectDatabase() {
  mongoose.set('strictQuery', true);
  const connection = await mongoose.connect(env.MONGODB_URI, {
    autoIndex: env.NODE_ENV !== 'production',
  });

  console.log(`MongoDB connected: ${connection.connection.name} @ ${connection.connection.host}`);
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
