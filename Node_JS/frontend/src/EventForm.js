// EventForm.js
import React, { useState } from 'react';

const EventForm = ({ onSubmit }) => {
    const [content, setContent] = useState('');
    const [eventTime, setEventTime] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ content, event_time: eventTime });
        setContent('');
        setEventTime('');
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Event content"
                required
            />
            <input
                type="datetime-local"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                required
            />
            <button type="submit">Add Event</button>
        </form>
    );
};

export default EventForm;
