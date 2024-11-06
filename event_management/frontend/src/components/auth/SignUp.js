import React, { useState } from "react";
import { Link } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import './SignUp.css';

const SignUp = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [notification, setNotification] = useState('');
    const [isSuccess, setIsSuccess] = useState(false); // Changed initial state to false
    const navigate = useNavigate(); // Corrected the spelling of `naviage` to `navigate`

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Send the sign up to the backend
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();  // Corrected: Await the response
            setNotification(`Registration successful: ${data.username}`);
            setIsSuccess(true);
            setUsername('');
            setPassword('');

            // Redirect to dashboard
            navigate('/auth/login');

        } else {
            const error = await response.text();
            setNotification(`Registration failed: ${error}`);
            setIsSuccess(false);
        }
    };

    return (
        <div>
            <h1 className="app-title">Event Management</h1>
            <p className="app-description">Manage your events efficiently and effortlessly.</p>

            <div className="signup-container">
                <h1 className="signup-title">Sign Up</h1>

                {notification && (
                    <p className={`notification ${isSuccess ? '' : 'error'}`}>
                        {notification}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="signup-form">
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
                    <button type="submit">Sign Up</button>
                </form>

                <p>
                    Already have an account? <a href="/auth/login">Login</a>
                </p>
                <p>
                    <Link to="/">Back to Dashboard</Link> {/* Link to home */}
                </p>
            </div>

        </div>
    );
};

export default SignUp;
