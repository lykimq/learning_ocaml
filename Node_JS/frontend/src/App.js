// App.js
import React, { useState } from 'react';
import EventForm from './EventForm';
import UserForm from './UserForm';
import UserList from './UserList';
import EventList from './EventList';

const App = () => {
    const [userId, setUserId] = useState(null); // Track logged-in user ID

    const handleUserSubmit = async (userData) => {
        const response = await fetch('http://localhost:5000/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });
        const result = await response.json();
        console.log('User registered:', result);
        setUserId(result.id); // Save the registered user's ID
    };

    const handleEventSubmit = async (eventData) => {
        const response = await fetch('http://localhost:5000/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...eventData, user_id: userId }), // Include user_id
        });
        const result = await response.json();
        console.log('Event created:', result);
        // Optionally, update the state to refresh the event list
    };

    return (
        <div>
            <h1>Event Management</h1>
            <UserForm onSubmit={handleUserSubmit} />
            {userId && <EventForm onSubmit={handleEventSubmit} />}
            <UserList />
            <EventList />
        </div>
    );
};

export default App;
