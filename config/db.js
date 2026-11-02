// config/db.js
// Vercel (serverless) ke liye cached MongoDB connection.
// Purani problem: connect sirf ek baar module load par hota tha. Agar wo ek baar fail ho jata
// to us instance par dobara kabhi connect nahi hota tha -> "bar bar server issue / login nahi hota".
import mongoose from "mongoose";

const cache = globalThis.__mongooseCache || (globalThis.__mongooseCache = { promise: null });

export const connectDB = async () => {
  // Already connected -> foran return
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not set");

  // Connection beech mein gir gayi ho to purana promise reset karo
  if (cache.promise && mongoose.connection.readyState === 0) {
    cache.promise = null;
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 8000, // 10s+ hang ki jagah jaldi fail
        socketTimeoutMS: 45000,
        maxPoolSize: 5, // serverless ke liye chhota pool
        retryWrites: true,
      })
      .then(() => mongoose.connection)
      .catch((err) => {
        cache.promise = null; // fail hua to agli request dobara try karegi
        throw err;
      });
  }

  return cache.promise;
};

export default connectDB;
