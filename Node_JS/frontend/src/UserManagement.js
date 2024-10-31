import React, { useEffect, useState } from 'react';
import UserForm from './UserForm';
import UserList from './UserList';

const UserManagement = () => {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            const response = await fetch('http://localhost:8000/api/users');
            const data = await response.json();
            setUsers(data);
        };
        fetchUsers();
    }, []);

    const handleUserSubmit = async ({ username, email }) => {
        const response = await fetch('http://localhost:8000/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email }),
        });

        if (response.ok) {
            const result = await response.json();
            setUsers((prev) => [...prev, result]);
        } else {
            const error = await response.json();
            alert(error.error); // Display error from Rust server
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
