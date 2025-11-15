import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router'; // Correct import for Next.js router
import { signIn } from 'next-auth/react'; // Correct import for NextAuth's client-side functions

// Utility to display a message to the user instead of using alert()
const useMessage = () => {
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | null } | null>(null);

    const showMessage = (text: string, type: 'success' | 'error') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 5000); // Hide message after 5 seconds
    };

    return { message, showMessage };
};

const RegisterPage: React.FC = () => {
    const emailInputRef = useRef<HTMLInputElement | null>(null);
    const passwordInputRef = useRef<HTMLInputElement | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { message, showMessage } = useMessage();

    async function submitHandler(event: React.FormEvent) {
        event.preventDefault();

        const email = emailInputRef.current?.value;
        const password = passwordInputRef.current?.value;

        // Client-side validation
        if (!email || !password || password.trim().length < 7) {
            showMessage('Password must be at least 7 characters long.', 'error');
            return;
        }

        setIsLoading(true);

        try {
            // 1. Send data to the custom Next.js API route for signup
            // This is the actual API call to pages/api/auth/signup.ts
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                showMessage(data.message || 'Registration failed.', 'error');
                setIsLoading(false);
                return;
            }

            // Successful signup
            showMessage('Registration successful! Logging you in...', 'success');

            // 2. Automatically log the user in using NextAuth Credentials Provider
            const result = await signIn('credentials', {
                redirect: false, // Prevents automatic redirect on success/failure
                email: email,
                password: password,
            });

            if (result && !result.error) {
                // Successful automatic login, redirect to a protected route
                router.replace('/app/');
            } else if (result?.error) {
                // Failed automatic login (e.g., if session token fails to generate)
                showMessage(`Registration succeeded, but login failed: ${result.error}`, 'error');
            }

        } catch (error) {
            console.error('An unexpected error occurred:', error);
            showMessage('An unexpected error occurred. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    }

    // --- UI Components ---
    const MessageDisplay = () => {
        if (!message) return null;
        return (
            <div
                className={`p-3 mb-4 rounded-lg text-sm transition-opacity duration-300 ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                    }`}
                role="alert"
            >
                {message.text}
            </div>
        );
    };

    const InputField = ({ label, id, type, reference }: { label: string, id: string, type: string, reference: React.RefObject<HTMLInputElement | null> }) => (
        <div className="mb-4">
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
                {label}
            </label>
            <input
                type={type}
                id={id}
                required
                ref={reference}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                placeholder={`Enter your ${label.toLowerCase()}`}
            />
        </div>
    );

    // Default: Register Page
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-inter">
            <div className="w-full max-w-md">
                <div className="bg-white p-8 rounded-xl shadow-2xl border border-gray-100">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">
                        Create Your Account
                    </h2>
                    <MessageDisplay />
                    <form onSubmit={submitHandler}>

                        <InputField
                            label="Email Address"
                            id="email"
                            type="email"
                            reference={emailInputRef}
                        />

                        <InputField
                            label="Password (min 7 characters)"
                            id="password"
                            type="password"
                            reference={passwordInputRef}
                        />

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out disabled:opacity-50"
                        >
                            {isLoading ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : 'Sign Up'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-600">
                        Already have an account?
                        <button
                            onClick={() => router.push('/login')}
                            className="font-medium text-indigo-600 hover:text-indigo-500 ml-1 focus:outline-none"
                        >
                            Sign In
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;