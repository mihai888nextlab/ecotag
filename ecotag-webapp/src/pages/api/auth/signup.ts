import { connectToDatabase } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import User from '@/models/User';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).end(); // Method Not Allowed
    }

    const { email, password } = req.body;

    // Basic validation
    if (!email || !password || password.trim().length < 7) {
        return res.status(422).json({
            message: 'Invalid input - password must be at least 7 characters long.'
        });
    }

    try {
        await connectToDatabase();

        const existingUser = await User.findOne({ email: email });

        if (existingUser) {
            return res.status(422).json({ message: 'User already exists!' });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const newUser = new User({
            email: email,
            password: hashedPassword,
        });

        await newUser.save();

        res.status(201).json({ message: 'User created successfully!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during signup.' });
    }
}