import React, {useState, useEffect, useCallback} from 'react';
import {Link} from 'react-router-dom';

import './EventNotification.css';

const EventNotification = () => {
  const [events, setEvents] = useState ([]);
  const [eventFilter, setEventFilter] = useState ('current'); // Default filter to show current events
  const [page, setPage] = useState (0);
  const [eventsVisible, setEventsVisible] = useState (false); // Define the state for event list visibility
  const pageSize = 20;

  // Fetch events based on filter
  const handleShowEvents = useCallback (async filter => {
    try {
      let url = `${process.env.REACT_APP_BACKEND_URL}/events/list`; // Default to show all events
      if (filter === 'current') {
        url = `${process.env.REACT_APP_BACKEND_URL}/events/current`;
      } else if (filter === 'future') {
        url = `${process.env.REACT_APP_BACKEND_URL}/events/future`;
      } else if (filter === 'both') {
        url = `${process.env.REACT_APP_BACKEND_URL}/events/current_future`;
      }

      const response = await fetch (url);
      if (!response.ok) {
        console.error ('Failed to fetch events.');
        return;
      }
      const eventList = await response.json ();
      setEvents (eventList);
    } catch (error) {
      console.error ('Error fetching events:', error);
    }
  }, []);

  // Pagination logic
  const paginatedEvents = events.slice (page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil (events.length / pageSize);

  // Show filter buttons to select between current, future, and both
  const onFilterSelected = filter => {
    setEventFilter (filter); // Set the selected filter
  };

  // Fetch events whenever the filter changes
  useEffect (
    () => {
      handleShowEvents (eventFilter);
    },
    [eventFilter, handleShowEvents]
  );

  // Toggle the visibility of the event list
  const toggleEventList = () => {
    setEventsVisible (prevVisible => !prevVisible);
  };

  return (
    <div className="event-notification-container">
      <h1 className="page-title">Event Notification Setup</h1>
      <p className="page-description">
        Here you can choose how to send notifications for events. This feature is under construction.
      </p>

      <p>
        <Link to="/">Back to Dashboard</Link>
      </p>

      <div className="section">
        <h2>Event List</h2>
        <p>
          Here, a list of all events will appear. You can select events to send notifications.
        </p>

        {/* Button to show/hide the event list */}
        <div className="toggle-event-list">
          <button className="toggle-button" onClick={toggleEventList}>
            {eventsVisible ? 'Hide Events' : 'Show Events'}
          </button>
        </div>

        {/* Event Filter Buttons */}
        {eventsVisible &&
          <div className="event-filters">
            <button onClick={() => onFilterSelected ('current')}>
              Current Events
            </button>
            <button onClick={() => onFilterSelected ('future')}>
              Future Events
            </button>
            <button onClick={() => onFilterSelected ('both')}>
              Current & Future Events
            </button>
          </div>}

        {/* Event Table */}
        {eventsVisible &&
          <div className="event-table">
            <h2>Event List</h2>
            <p>Total Events: {events.length}</p>

            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Event Title</th>
                  <th>Event Date</th>
                  <th>Event Time</th>
                  <th>Address</th>
                  <th>Content</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEvents.map ((event, index) => (
                  <tr key={event.id}>
                    <td>{index + 1 + page * pageSize}</td>
                    <td>{event.event_title}</td>
                    <td>{event.event_day}</td>
                    <td>{event.event_time}</td>
                    <td>{event.address}</td>
                    <td>{event.content}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="pagination">
              <button
                className="pagination-button"
                onClick={() => setPage (prev => Math.max (prev - 1, 0))}
                disabled={page === 0}
              >
                Previous
              </button>
              <button
                className="pagination-button"
                onClick={() =>
                  setPage (prev => Math.min (prev + 1, totalPages - 1))}
                disabled={page === totalPages - 1}
              >
                Next
              </button>
              <span>{` Page ${page + 1} of ${totalPages} `}</span>
            </div>
          </div>}

        {/* Placeholder for sending notifications */}
        <div className="notification-options">
          <h2>Choose Notification Method</h2>
          <div>
            <button>Email</button>
            <button>SMS</button>
            <button>Google Calendar</button>
            <button>WhatsApp</button>
          </div>
        </div>
      </div>

      <p>
        <Link to="/">Back to Dashboard</Link>
      </p>

    </div>
  );
};

export default EventNotification;
