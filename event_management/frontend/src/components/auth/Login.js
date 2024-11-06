import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [notification, setNotification] = useState('');
    const [isSuccess, setIsSuccess] = useState('');
    const naviage = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Handler login
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });


        // Check for successful login
        if (response.ok) {

            const data = await response.json();
            setNotification(`Login sucessful:, ${data.username}`);
            setIsSuccess(true);
            setUsername('');
            setPassword('');

            // Save login status to localStorage
            localStorage.setItem("isLoggedIn", true);
            localStorage.setItem("username", username);

            naviage('/auth/dashboard')
        }
        else {
            const error = await response.text();
            setNotification(`Login failed: ${error}`);
            setIsSuccess(false);
        }

    };

    //TODO
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

                {notification && (
                    <p className={`notification ${isSuccess ? '' : 'error'}`}>
                        {notification}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
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
                        Don't have an account? <a href="/auth/login">Sign up</a>
                    </p>
                </div>
                <p>
                    <Link to="/">Back to Dashboard</Link> {/* Link to home */}
                </p>
            </div>
        </div>
    );
};

export default Login;
