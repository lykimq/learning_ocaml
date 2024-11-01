import React, { useEffect, useState } from 'react';
import "./UserRegistration.css";

const UserRegistration = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [users, setUsers] = useState([]); // State to hold users
    const [isEditing, setIsEditing] = useState(false);
    const [editUserId, setEditUserId] = useState(null);
    const [page, setPage] = useState(0);
    const pageSize = 20;
    const [sortBy, setSortBy] = useState('');

    //Add/edit user function
    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = isEditing ? `http://localhost:3030/users/${editUserId}/edit` : 'http://localhost:3030/register';
        const method = isEditing ? 'PUT' : 'POST'

        try {
            const response = await fetch(url, {
                method,
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

            setMessage(isEditing ? 'User updated successfully.' : 'User registered successfully.');
            // Clear the input fields after successful registration
            setUsername('');
            setEmail('');
            setIsEditing(false);
            setEditUserId(null);
            handleShowUsers()

        } catch (error) {
            setMessage("An error occurred. Please try again.");
        }
    };


    // Function to fetch users
    const handleShowUsers = async (sortBy = '') => {
        try {
            const response = await fetch(`http://localhost:3030/users?sort_by=${sortBy}`);
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

    //Edit user
    const handleEditUser = (user) => {
        setUsername(user.username);
        setEmail(user.email);
        setIsEditing(true);
        setEditUserId(user.id)
    };

    //Delete a user
    const handleDeleteUser = async (id) => {
        try {
            const response = await fetch(`http://localhost:3030/users/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                setMessage("Failed to delete user.");
                return;
            }
            setMessage("User deleted successfully.");
            handleShowUsers();
        }
        catch (error) {
            setMessage("An error occurred while deleting the user.")
        }
    };

    // useEffect to fetch users on component mount
    useEffect(() => {
        handleShowUsers();
    }, []);

    // Handle sorting
    const handleSort = (sortOption) => {
        setSortBy(sortOption);
        handleShowUsers(sortOption);
    };

    const paginatedUsers = users.slice(page * pageSize, (page + 1) * pageSize);
    const totalPages = Math.ceil(users.length / pageSize);


    return (
        <div className="registration-page">
            <h1>Event Management</h1>
            <div className="container">
                <h2>User Registration</h2>
                <p>Register to receive notifications about upcoming events.</p>
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
                    <button type="submit">{isEditing ? 'Update' : 'Register'}</button>
                </form>
                {message && <div className="message">{message}</div>}
            </div>

            <div className="user-table">
                <h2>Registered Users</h2>
                <p>Total Users: {users.length}</p>
                {/* Add sort buttons */}
                <div className="pagination">
                    <button className="sort-button" onClick={() => handleSort('username')}>Sort by Username</button>
                    <button className="sort-button" onClick={() => handleSort('email')}>Sort by Email</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedUsers.map((user, index) => (
                            <tr key={user.id}>
                                <td>{index + 1 + page * pageSize}</td>
                                <td>{user.username}</td>
                                <td>{user.email}</td>
                                <td>
                                    <button onClick={() => handleEditUser(user)}>Edit</button>
                                    <button onClick={() => handleDeleteUser(user.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="pagination">
                    <button className="pagination-button" onClick={() => setPage((prev) => Math.max(prev - 1, 0))} disabled={page === 0}>
                        Previous
                    </button>
                    <button className="pagination-button" onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))} disabled={page === totalPages - 1}>
                        Next
                    </button>
                    <span>{` Page ${page + 1} of ${totalPages} `}</span>
                </div>
            </div>
        </div>
    );
};


export default UserRegistration;
