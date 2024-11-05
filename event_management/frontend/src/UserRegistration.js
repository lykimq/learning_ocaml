// src/UserRegistration.js

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './UserRegistration.css';

const UserRegistration = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email }),
        });

        const data = await response.json();
        console.log(data);
        // Handle registration success or error here
    };

    return (
        <div>
            <h1 className="app-title">Event Management</h1>
            <p className="app-description">Manage your events efficiently and effortlessly.</p>

            <div className="registration-container">
                <h1 className="registration-title">User Registration</h1>
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
            </div>

            <p>
                <Link to="/">Back to Home</Link> {/* Link to home */}
            </p>

        </div>
    );
};

export default UserRegistration;
