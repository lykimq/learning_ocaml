// EventList.js
import React, { useEffect, useState } from 'react';

const EventList = () => {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        const fetchEvents = async () => {
            const response = await fetch('http://localhost:5000/api/events');
            const data = await response.json();
            setEvents(data);
        };
        fetchEvents();
    }, []);

    return (
        <div>
            <h2>Events</h2>
            <ul>
                {events.map((event) => (
                    <li key={event.id}>
                        {event.content} at {new Date(event.event_time).toLocaleString()}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default EventList;
