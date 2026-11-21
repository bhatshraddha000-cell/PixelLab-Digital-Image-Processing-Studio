import mongoose from 'mongoose';

/**
 * Connect to MongoDB using Mongoose.
 * If connection fails or MONGODB_URI is absent, log a clear warning without crashing the server.
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('\x1b[33m%s\x1b[0m', '⚠️  [Database Warning]: MONGODB_URI is not set. Running in offline/disconnected database mode.');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000, // Timeout fast if local mongod is not running
    });
    console.log('\x1b[32m%s\x1b[0m', `✅ [Database Connected]: MongoDB connected to ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    console.warn('\x1b[33m%s\x1b[0m', `⚠️  [Database Warning]: Could not connect to MongoDB (${error.message}). Server will continue running without database persistence for this phase.`);
    return false;
  }
};

export const getDBStatus = () => {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[state] || 'unknown';
};

