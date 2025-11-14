// lib/db.ts
import mongoose from 'mongoose';

export async function connectToDatabase() {
    if (mongoose.connection.readyState >= 1) {
        return; // Already connected
    }

    await mongoose.connect(process.env.MONGODB_URI!, {
        // MongoDB connection options
    });
}