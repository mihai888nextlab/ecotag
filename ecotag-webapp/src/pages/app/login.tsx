// pages/login.tsx
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import React, { useRef } from 'react';

const LoginPage: React.FC = () => {
    const emailInputRef = useRef<HTMLInputElement>(null);
    const passwordInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    async function submitHandler(event: React.FormEvent) {
        event.preventDefault();

        const email = emailInputRef.current?.value;
        const password = passwordInputRef.current?.value;

        const result = await signIn('credentials', {
            redirect: false, // Prevents automatic redirect on success/failure
            email: email,
            password: password,
        });

        if (result && !result.error) {
            // Successful login!
            router.replace('/app/'); // Redirect to a protected page
        } else if (result?.error) {
            // Handle login failure
            alert(result.error);
        }
    }

    return (
        <form onSubmit={submitHandler}>
            <div>
                <label htmlFor='email'>Your Email</label>
                <input type='email' id='email' required ref={emailInputRef} />
            </div>
            <div>
                <label htmlFor='password'>Your Password</label>
                <input type='password' id='password' required ref={passwordInputRef} />
            </div>
            <button>Login</button>
        </form>
    );
};

export default LoginPage;