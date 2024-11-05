import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        console.log(data);
        // Handle login logic here, e.g., store user info
    };

    const handleGoogleLogin = () => {
        // Implement Google login logic here
        console.log('Login with Google');
    };


    return (
        <div>
            <h1 className="app-title">Event Management</h1>
            <p className="app-description">Manage your events efficiently and effortlessly.</p>

            <div className="login-container">
                <h1 className="login-title">Login</h1>
                <form onSubmit={handleSubmit} className="login-form">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit">Login</button>
                </form>
                <div className="login-options">
                    <button className="google-login" onClick={handleGoogleLogin}>
                        Login with Google
                    </button>
                    <p>
                        Don't have an account? <a href="/register">Register here</a>
                    </p>

                </div>
            </div>
            <p>
                <Link to="/">Back to Home</Link> {/* Link to home */}
            </p>

        </div>
    );
};

export default Login;
