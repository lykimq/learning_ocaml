// UserForm.js
import React, { useState } from 'react';

const UserForm = ({ onSubmit }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ username, email });
        setUsername('');
        setEmail('');
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
            />
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
            />
            <button type="submit">Register User</button>
        </form>
    );
};

export default UserForm;
