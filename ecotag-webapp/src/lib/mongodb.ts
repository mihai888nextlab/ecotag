// lib/mongodb.ts

import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!uri) {
    throw new Error('Please add your MONGODB_URI to .env.local');
}

if (process.env.NODE_ENV === 'development') {
    // In development, use a global variable so the connection
    // is preserved across module reloads (Next.js HMR)
    let globalWithMongo = global as typeof global & {
        _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
        client = new MongoClient(uri, options);
        globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
} else {
    // In production (or other environments), establish a new connection
    // which will be reused by the serverless instance.
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

// clientPromise is what you export and import into NextAuth.js
export default clientPromise;