import React, { useState } from 'react';
import "./UserRegistration.css";

const UserRegistration = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [users, setUsers] = useState([]); // State to hold users

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('http://localhost:3030/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email }),
            });

            // Check if the response is ok (status in the range 200-299)
            if (!response.ok) {
                const errorMessage = await response.text();
                setMessage(errorMessage);
                return;
            }

            const data = await response.text();
            setMessage(data);
            // Clear the input fields after successful registration
            setUsername('');
            setEmail('');

        } catch (error) {
            setMessage("An error occurred. Please try again.");
        }
    };

    const handleShowUsers = async () => {
        try {
            const response = await fetch('http://localhost:3030/users');
            if (!response.ok) {
                setMessage("Failed to fetch users.");
                return;
            }
            const userList = await response.json();
            setUsers(userList); // Update state with user list
        } catch (error) {
            setMessage("An error occurred while fetching users.");
        }
    };

    return (
        <div className="registration-page">
            <h1>User Registration</h1>
            <p>
                Register to receive notifications about upcoming events.
                Stay informed and never miss out on what’s happening!
            </p>
            <div className="container"> {/* Apply the container class */}
                <form onSubmit={handleSubmit}>
                    <label>
                        Username:
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </label>
                    <label>
                        Email:
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </label>
                    <button type="submit">Register</button>
                </form>
                {message && <div className="message">{message}</div>} {/* Apply the message class */}
                <button className="show-users-button" onClick={handleShowUsers}>
                    Show User List
                </button>
                {/* Display the list of registered users */}
                {users.length > 0 && (
                    <ul className="user-list">
                        {users.map((user) => (
                            <li key={user.id}>
                                {user.username} - {user.email}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default UserRegistration;
