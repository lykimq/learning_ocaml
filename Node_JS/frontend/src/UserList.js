// UserList.js
import React, { useEffect, useState } from 'react';

const UserList = () => {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            const response = await fetch('http://localhost:5000/api/users');
            const data = await response.json();
            setUsers(data);
        };
        fetchUsers();
    }, []);

    return (
        <div>
            <h2>Registered Users</h2>
            <ul>
                {users.map((user) => (
                    <li key={user.id}>{user.username} ({user.email})</li>
                ))}
            </ul>
        </div>
    );
};

export default UserList;
