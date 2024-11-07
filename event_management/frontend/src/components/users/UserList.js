import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from 'react-router-dom';
import './UserList.css';  // Import the CSS file

const UserList = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [users, setUsers] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editUserId, setEditUserId] = useState(null);
    const [message, setMessage] = useState('');
    const [sortBy, setSortBy] = useState(''); // Default sort by username
    const [page, setPage] = useState(0);
    const [showUserList, setShowUserList] = useState(false);  // New state to toggle user list visibility
    const pageSize = 20;

    const navigate = useNavigate();

    // Add/edit user function
    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = isEditing ? `${process.env.REACT_APP_BACKEND_URL}/users/${editUserId}/edit` : `${process.env.REACT_APP_BACKEND_URL}/users/register`;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email }),
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                setMessage(errorMessage);
                return;
            }

            setMessage(isEditing ? 'User updated successfully.' : 'User registered successfully.');
            setUsername('');
            setEmail('');
            setIsEditing(false);
            setEditUserId(null);
            handleShowUsers(sortBy);
        } catch (error) {
            setMessage("An error occurred. Please try again.");
        }
    };

    // Fetch users
    const handleShowUsers = useCallback(async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/users/admin/list?sort_by=${sortBy}`);
            if (!response.ok) {
                setMessage("Failed to fetch users.");
                return;
            }
            const userList = await response.json();
            setUsers(userList);
        } catch (error) {
            setMessage("Error fetching users:", error);
        }
    }, [sortBy]);

    // Edit user
    const handleEditUser = (user) => {
        setUsername(user.username);
        setEmail(user.email);
        setIsEditing(true);
        setEditUserId(user.id);
    };

    // Delete a user
    const handleDeleteUser = async (id) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/users/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                setMessage("Failed to delete user.");
                return;
            }
            setMessage("User deleted successfully.");
            handleShowUsers();
        } catch (error) {
            setMessage("An error occurred while deleting the user.");
        }
    };

    useEffect(() => {
        handleShowUsers();
    }, [handleShowUsers]);

    // Handle sorting
    const handleSort = (sortOption) => {
        setSortBy(sortOption);
        handleShowUsers(sortOption);
    };

    const paginatedUsers = users.slice(page * pageSize, (page + 1) * pageSize);
    const totalPages = Math.ceil(users.length / pageSize);


    const handleSignOut = () => {
        // Clear login status
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        localStorage.removeItem('isAdmin');

        navigate("/")
    };

    return (
        <div className="dashboard-container">
            <h1 className="app-title">Welcome to Event Management Dashboard</h1>
            <p className="app-description">Manage your events efficiently and effortlessly.</p>

            <div className="registration-page">
                <div className="container-register">
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

                <div className="container-table">
                    <div className="toggle-user-list">
                        <h3 className="app-title">Admin Controls</h3>
                        <p className="app-description">You can choose to show or hide the list of registered users.</p>
                        <button
                            onClick={() => setShowUserList((prev) => !prev)}
                            className="toggle-button"
                        >
                            {showUserList ? 'Hide' : 'Show'} User List
                        </button>
                    </div>

                    {showUserList && (
                        <div className="user-table">
                            <h2>Registered Users</h2>
                            <p>Total Users: {users.length}</p>
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
                    )}
                </div>


            </div>
            <button onClick={handleSignOut} className="sign-out-button">
                Sign Out
            </button>

            <p>
                <Link to="/">Back to Dashboard</Link> {/* Link to home */}
            </p>
        </div>
    );
};

export default UserList;
