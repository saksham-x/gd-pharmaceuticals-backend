import dns from 'node:dns';
import mongoose from 'mongoose';
import { config } from './env.js';

export async function connectDB(): Promise<void> {
  if (config.dnsServers.length > 0) {
    // mongodb+srv:// needs an SRV lookup through Node's own resolver. On some Windows
    // setups that resolver falls back to 127.0.0.1 and fails with "querySrv ECONNREFUSED".
    dns.setServers(config.dnsServers);
  }

  mongoose.set('strictQuery', true);

  mongoose.connection.on('error', (err: Error) => {
    console.error('MongoDB connection error:', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });

  await mongoose.connect(config.mongoUri);
  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
