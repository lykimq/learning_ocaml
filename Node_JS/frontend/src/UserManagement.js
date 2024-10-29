import React, { useState, useEffect } from 'react';
import UserForm from './UserForm';
import UserList from './UserList';

const UserManagement = () => {
    const [users, setUsers] = useState([]);

    // Fetch registered users when the component mounts
    useEffect(() => {
        const fetchUsers = async () => {
            const response = await fetch('http://localhost:5000/api/users');
            const data = await response.json();
            setUsers(data);
        };
        fetchUsers();
    }, []);

    const handleUserSubmit = async ({ username, email }) => {
        try {
            const response = await fetch('http://localhost:5000/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email }),
            });

            // Check if the response is OK (status in the range 200-299)
            if (response.ok) {
                const result = await response.json();
                return { success: true, user: result }; // Return user data on success
            } else {
                const errorData = await response.json();
                return { success: false, error: errorData.error }; // Return the error message from the server
            }
        } catch (error) {
            console.error('Error during user submission:', error);
            return { success: false, error: 'An unexpected error occurred. Please try again.' }; // Handle unexpected errors
        }
    };


    return (
        <div>
            <h2>User Management</h2>
            <UserForm onSubmit={handleUserSubmit} />
            <UserList users={users} />
        </div>
    );
};

export default UserManagement;
