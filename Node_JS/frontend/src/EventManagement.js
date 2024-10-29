import React, { useEffect, useState } from 'react';
import EventForm from './EventForm';
import EventList from './EventList';

const EventManagement = () => {
    const [events, setEvents] = useState([]);

    // Fetch events when the component mounts
    useEffect(() => {
        const fetchEvents = async () => {
            const response = await fetch('http://localhost:5000/api/events');
            const data = await response.json();
            setEvents(data);
        };
        fetchEvents();
    }, []);

    const handleEventSubmit = async (eventData) => {
        const response = await fetch('http://localhost:5000/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData),
        });

        if (response.ok) {
            const result = await response.json();
            setEvents((prev) => [...prev, result]); // Update event list after successful registration
        }
    };

    return (
        <div>
            <EventForm onSubmit={handleEventSubmit} />
            <EventList events={events} /> {/* Show the list of events */}
        </div>
    );
};

export default EventManagement;
