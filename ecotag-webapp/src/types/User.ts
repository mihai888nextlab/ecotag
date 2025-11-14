// types/User.ts (You might want to put this in a separate types file)

import { Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    password: string; // Stored as the hashed password
    // Add other fields you might need (e.g., name, isAdmin, createdAt)
    createdAt: Date;
    updatedAt: Date;
}