import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import { connectToDatabase } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import User from '@/models/User';

export default NextAuth({
    session: {
        strategy: "jwt",
    },
    adapter: MongoDBAdapter(clientPromise),
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials, req) {
                // 1. Connect to DB and find user
                await connectToDatabase();
                const user = await User.findOne({ email: credentials?.email });

                if (!user) {
                    throw new Error('No user found with that email!');
                }

                // 2. Compare passwords (utility function using bcrypt)
                const isValid = await verifyPassword(credentials!.password, user.password);

                if (!isValid) {
                    throw new Error('Could not log you in!');
                }

                // 3. Return user object if successful (this becomes the JWT payload)
                return {
                    id: String((user as any)._id), // Must include an ID
                    email: user.email,
                    // Add other user data you want in the session
                };
            }
        })
    ],
    // Add secret and other configuration here
    secret: process.env.NEXTAUTH_SECRET,
});