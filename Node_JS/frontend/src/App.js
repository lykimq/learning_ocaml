import React, { useState, useEffect } from 'react';
import UserForm from './UserForm';
import UserList from './UserList';
import EventForm from './EventForm';
import EventList from './EventList';
import { BrowserRouter as Router, Route, Link, Routes } from 'react-router-dom';

const App = () => {
    return (
        <Router>
            <div>
                <h1>Event Management</h1>
                <nav>
                    <Link to="/">Users</Link>
                    <Link to="/events">Events</Link>
                </nav>
                <Routes>
                    <Route path="/" element={<UserManagement />} />
                    <Route path="/events" element={<EventManagement />} />
                </Routes>
            </div>
        </Router>
    );
};

const UserManagement = () => {
    const [users, setUsers] = useState([]);

    const handleUserSubmit = async (userData) => {
        const response = await fetch('http://localhost:5000/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });
        const result = await response.json();
        setUsers((prev) => [...prev, result]);
    };

    return (
        <div>
            <UserForm onSubmit={handleUserSubmit} />
            <UserList users={users} />
        </div>
    );
};

const EventManagement = () => {
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

    const handleEventSubmit = async (eventData, selectedUserIds) => {
        const response = await fetch('http://localhost:5000/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...eventData, userIds: selectedUserIds }),
        });
        const result = await response.json();
        console.log('Event created:', result);
    };

    return (
        <div>
            <EventForm onSubmit={handleEventSubmit} users={users} />
            <EventList />
        </div>
    );
};

export default App;
