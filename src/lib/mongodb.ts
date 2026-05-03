import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/t3-users";

declare global {
  var _mongooseConn: { promise: Promise<typeof mongoose> | null; conn: typeof mongoose | null } | undefined;
}

const cached = global._mongooseConn ?? (global._mongooseConn = { promise: null, conn: null });

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
