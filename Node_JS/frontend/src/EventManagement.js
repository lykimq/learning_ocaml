import React, { useEffect, useState } from 'react';
import EventForm from './EventForm';
import EventList from './EventList';

const EventManagement = () => {
    const [events, setEvents] = useState([]);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            const response = await fetch('http://localhost:8000/api/users');
            const data = await response.json();
            setUsers(data);
        };

        const fetchEvents = async () => {
            const response = await fetch('http://localhost:8000/api/events');
            const data = await response.json();
            setEvents(data);
        };

        fetchUsers();
        fetchEvents();
    }, []);

    const handleEventSubmit = async (eventData, selectedUserIds) => {
        const response = await fetch('http://localhost:8000/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...eventData, userIds: selectedUserIds }),
        });

        if (response.ok) {
            const result = await response.json();
            setEvents((prev) => [...prev, result]);
        } else {
            const error = await response.json();
            alert(error.error); // Display error from Rust server
        }
    };

    return (
        <div>
            <h2>Event Management</h2>
            <EventForm onSubmit={handleEventSubmit} users={users} />
            <EventList events={events} />
        </div>
    );
};

export default EventManagement;
