import mongoose from "mongoose";

/**
 * TypeScript Global Extension for Mongoose Caching
 * Ensures the 'mongoose' variable is typed correctly on the global object to prevent 
 * multiple connection attempts during Next.js hot reloads.
 */
declare global {
  var mongoose: { conn: any; promise: Promise<any> | null; } | undefined;
}

const MONGO_URI = process.env.MONGO_URI;

// 1. Strict Validation BEFORE connection attempt
if (!MONGO_URI || (!MONGO_URI.startsWith("mongodb://") && !MONGO_URI.startsWith("mongodb+srv://"))) {
  throw new Error("❌ Error: Invalid or missing MONGO_URI. Please update your .env.local file with a valid MongoDB connection string.");
}

// 2. Global cache management
let cached = global.mongoose || (global.mongoose = { conn: null, promise: null });

/**
 * Connects to MongoDB using caching to maintain a single connection.
 */
async function connectDB() {
  // 1. Connection State Check (Fast return if already connected)
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // 2. Return cached connection if available
  if (cached.conn) {
    return cached.conn;
  }

  // 3. Initiate new connection if no promise exists
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 15,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    console.log("⏳ Connecting to MongoDB...");

    cached.promise = mongoose.connect(MONGO_URI!, opts)
      .then((mongooseInstance) => {
        console.log("✅ MongoDB connected:", mongooseInstance.connection.host);
        return mongooseInstance;
      })
      .catch((error) => {
        console.error("❌ MongoDB connection error:", error.message);
        cached.promise = null; // Reset promise on failure
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // Reset promise on failure
    throw e;
  }

  return cached.conn;
}

// Global Check for JWT_SECRET (Prevent using placeholders in production)
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes("your_secure_jwt_secret")) {
  console.warn("⚠️ Warning: JWT_SECRET is not properly configured or is using a placeholder. This is insecure.");
}

export default connectDB;

/**
 * Reliable Transaction Wrapper with Retry Logic
 * Ensures atomicity and handles transient MongoDB errors.
 */
export async function runWithRetry<T>(
  fn: (session: mongoose.ClientSession | null) => Promise<T>, 
  retries = 3
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < retries; i++) {
    const session = await mongoose.startSession();
    try {
      const result = await session.withTransaction(async () => {
        return await fn(session);
      }, {
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
        readPreference: "primary"
      });
      return result as T;
    } catch (err: any) {
      lastError = err;
      
      // 🕵️ Detect if transactions are NOT supported (Standalone MongoDB)
      const isStandaloneError = 
        err.message.includes("Transaction numbers are only allowed on a replica set member") ||
        err.message.includes("does not support sessions") ||
        err.code === 20; // IllegalOperation

      if (isStandaloneError) {
        console.warn("⚠️ [DB] Standalone MongoDB detected. Falling back to non-transactional execution.");
        await session.endSession();
        // Execute without a session
        return await fn(null);
      }

      console.warn(`⚠️ Transaction attempt ${i + 1} failed:`, err.message);
      if (i === retries - 1) break;
    } finally {
      if (session.inTransaction()) {
         // withTransaction handles this, but session.endSession() is still needed
      }
      await session.endSession();
    }
  }
  
  throw lastError;
}
