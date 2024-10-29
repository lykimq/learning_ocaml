import React, { useState } from 'react';

const UserForm = ({ onSubmit }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        const result = await onSubmit({ username, email });

        // Check if the result is defined and contains a success property
        if (result && result.success) {
            setSuccessMessage('User registered successfully!');
            setUsername('');
            setEmail('');
        } else if (result && result.error) {
            setErrorMessage(result.error); // Display the error message returned from the server
        } else {
            setErrorMessage('An unexpected error occurred.'); // Fallback error message
        }
    };

    return (
        <div>
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
            {errorMessage && (
                <div style={{ color: 'red', marginTop: '10px' }}>
                    <strong>Error:</strong> {errorMessage}
                </div>
            )}
            {successMessage && (
                <div style={{ color: 'green', marginTop: '10px' }}>
                    <strong>Success:</strong> {successMessage}
                </div>
            )}
        </div>
    );
};

export default UserForm;
