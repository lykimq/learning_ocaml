import React, { useEffect, useState } from 'react';

const EventList = () => {
    const [events, setEvents] = useState([]); // Initialize as an empty array
    const [filter, setFilter] = useState('all'); // State for filtering events


    useEffect(() => {
        const fetchEvents = async () => {
            const response = await fetch('http://localhost:5000/api/events');
            const data = await response.json();
            setEvents(data);
        };
        fetchEvents();
    }, []);

    const filteredEvents = events.filter((event) => {
        const eventDate = new Date(event.event_time);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today to start of the day

        if (filter === 'future') {
            return eventDate >= today;
        }
        return true; // Return all events if 'all' is selected
    });

    return (
        <div>
            <h2>Events</h2>
            <select onChange={(e) => setFilter(e.target.value)} value={filter}>
                <option value="all">All Events</option>
                <option value="future">Current and Future Events</option>
            </select>
            <ul>
                {filteredEvents.length > 0 ? (
                    filteredEvents.map((event) => {
                        const eventDate = new Date(event.event_time);
                        const isPast = eventDate < new Date();

                        return (
                            <li key={event.id} style={{ textDecoration: isPast ? 'line-through' : 'none' }}>
                                {event.content} at {eventDate.toLocaleString()}
                                {isPast && ' (Past Event)'} {/* Mark past events */}
                            </li>
                        );
                    })
                ) : (
                    <p>No events registered yet.</p>
                )}
            </ul>
        </div>
    );
};

export default EventList;
