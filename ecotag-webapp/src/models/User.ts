// models/User.ts

import mongoose, { Schema, Model, model } from 'mongoose';
import { IUser } from '../types/User'; // Import the interface from above

// 1. Define the Schema
const UserSchema: Schema<IUser> = new Schema<IUser>({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    // Mongoose automatically adds `createdAt` and `updatedAt` with timestamps: true
}, {
    timestamps: true
});


// 2. Define the Model
// Check if the model already exists to prevent re-compilation in Next.js hot reload
const User: Model<IUser> =
    (mongoose.models.User as Model<IUser>) ||
    model<IUser>('User', UserSchema);

export default User;