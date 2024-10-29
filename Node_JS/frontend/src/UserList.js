import React, { useEffect, useState } from 'react';

const UserList = () => {
    const [users, setUsers] = useState([]); // Initialize as an empty array
    const [error, setError] = useState(null); // For handling errors

    // Fetch registered users when the component mounts
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/users');
                if (!response.ok) {
                    throw new Error('Failed to fetch users');
                }
                const data = await response.json();
                setUsers(data); // Set the fetched users
            } catch (err) {
                setError(err.message); // Handle error
            }
        };
        fetchUsers();
    }, []);

    return (
        <div>
            <h3>Registered Users:</h3>
            {error && <p>{error}</p>} {/* Display error if any */}
            {users.length > 0 ? (
                <ul>
                    {users.map((user) => (
                        <li key={user.id}>
                            {user.username} - {user.email}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No users registered yet.</p>
            )}
        </div>
    );
};

export default UserList;
