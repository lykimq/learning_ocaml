import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './UserRegistration.css';

const UserRegistration = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [notification, setNotification] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/auth/user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email }),
        });

        if (response.ok) {
            const data = await response.json();
            setNotification(`Registration successful: ${data.username}`);
            setIsSuccess(true);
            setUsername('');
            setEmail('');
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

            <div className="registration-container">
                <h1 className="registration-title">User Registration</h1>

                {notification && (
                    <p className={`notification ${isSuccess ? '' : 'error'}`}>
                        {notification}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="registration-form">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email (must be unique)"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <button type="submit">Register</button>
                </form>

                <p>
                    <Link to="/">Back to Home</Link> {/* Link to home */}
                </p>

            </div>

        </div>
    );
};

export default UserRegistration;
