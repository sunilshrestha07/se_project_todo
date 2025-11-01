import mongoose from "mongoose";

mongoose.set("strictQuery", false);

const MONGODB_URI = process.env.MONGODB_URI as string | undefined;

if (!MONGODB_URI && process.env.NODE_ENV !== "test") {
  throw new Error(
    "Please define the MONGODB_URI environment variable in .env.local"
  );
}

let cached = (global as any).mongoose as {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    if (process.env.NODE_ENV === "test") {
      cached.promise = Promise.resolve(mongoose as unknown as typeof mongoose);
      return cached.promise;
    }
    cached.promise = mongoose.connect(MONGODB_URI as string, {
      dbName: process.env.MONGODB_DB || "nextjs_todos",
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

if (process.env.NODE_ENV !== "test") {
  void dbConnect();
}

export default dbConnect;
