import React, {useState, useEffect, useCallback} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import './EventManagement.css';

const EventManagement = () => {
  const [eventTitle, setEventTitle] = useState ('');
  const [eventDate, setEventDate] = useState ('');
  const [eventTime, setEventTime] = useState ('');
  const [address, setAddress] = useState ('');
  const [content, setContent] = useState ('');
  const [events, setEvents] = useState ([]);
  const [isEditing, setIsEditing] = useState (false);
  const [editEventId, setEditEventId] = useState (null);
  const [message, setMessage] = useState ('');
  const [eventFilter, setEventFilter] = useState ('all'); // Default filter
  const [page, setPage] = useState (0);
  const pageSize = 20;

  const navigate = useNavigate ();

  // Edit event function
  const handleSubmit = async e => {
    e.preventDefault ();
    const url = `${process.env.REACT_APP_BACKEND_URL}/events/edit/${editEventId}`;
    const method = 'PUT';

    try {
      const response = await fetch (url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify ({
          event_title: eventTitle,
          event_day: eventDate,
          event_time: eventTime,
          address,
          content,
        }),
      });

      if (!response.ok) {
        const errorMessage = await response.text ();
        setMessage (errorMessage);
        return;
      }

      setMessage ('Event updated successfully.');
      resetForm ();
      handleShowEvents (eventFilter); // Load events with the current filter
    } catch (error) {
      setMessage ('An error occurred. Please try again.');
    }
  };

  // Fetch events based on filter
  const handleShowEvents = useCallback (async filter => {
    try {
      let url = `${process.env.REACT_APP_BACKEND_URL}/events/list`;
      if (filter === 'past') {
        url = `${process.env.REACT_APP_BACKEND_URL}/events/past`;
      } else if (filter === 'current') {
        url = `${process.env.REACT_APP_BACKEND_URL}/events/current`;
      } else if (filter === 'future') {
        url = `${process.env.REACT_APP_BACKEND_URL}/events/future`;
      }

      const response = await fetch (url);
      if (!response.ok) {
        setMessage ('Failed to fetch events.');
        return;
      }
      const eventList = await response.json ();
      setEvents (eventList);
    } catch (error) {
      setMessage ('Error fetching events:', error);
    }
  }, []);

  // Edit event
  const handleEditEvent = event => {
    setEventTitle (event.event_title);
    setEventDate (event.event_day);
    setEventTime (event.event_time);
    setAddress (event.address);
    setContent (event.content);
    setIsEditing (true);
    setEditEventId (event.id);
  };

  // Delete event
  const handleDeleteEvent = async id => {
    try {
      const response = await fetch (
        `${process.env.REACT_APP_BACKEND_URL}/events/${id}`,
        {
          method: 'DELETE',
        }
      );
      if (!response.ok) {
        setMessage ('Failed to delete event.');
        return;
      }
      setMessage ('Event deleted successfully.');
      handleShowEvents (eventFilter);
    } catch (error) {
      setMessage ('An error occurred while deleting the event.');
    }
  };

  // Sign out
  const handleSignOut = () => {
    localStorage.removeItem ('isLoggedIn');
    localStorage.removeItem ('username');
    localStorage.removeItem ('isAdmin');
    navigate ('/');
  };

  // Cancel editing
  const cancelEdit = () => {
    resetForm ();
    handleShowEvents (eventFilter); // Ensure the event list is shown with the current filter
  };

  const resetForm = () => {
    setEventTitle ('');
    setEventDate ('');
    setEventTime ('');
    setAddress ('');
    setContent ('');
    setIsEditing (false);
    setEditEventId (null);
  };

  useEffect (
    () => {
      handleShowEvents (eventFilter); // Fetch events whenever the filter changes
    },
    [eventFilter, handleShowEvents]
  );

  // Pagination
  const paginatedEvents = events.slice (page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil (events.length / pageSize);

  // Show filter buttons
  const onFilterSelected = filter => {
    setEventFilter (filter); // Set the selected filter
  };

  return (
    <div className="dashboard-container">
      <h1 className="app-title">Event Management Dashboard</h1>
      <p className="app-description">Manage your events efficiently.</p>

      <button onClick={handleSignOut} className="sign-out-button">
        Sign Out
      </button>

      <p>
        <Link to="/">Back to Dashboard</Link>
      </p>

      <div className="event-management-page">
        {/* Show filter buttons always */}
        <div className="event-filters">
          <button onClick={() => onFilterSelected ('all')}>All Events</button>
          <button onClick={() => onFilterSelected ('past')}>Past Events</button>
          <button onClick={() => onFilterSelected ('current')}>
            Current Events
          </button>
          <button onClick={() => onFilterSelected ('future')}>
            Future Events
          </button>
        </div>

        {/* Show the edit form when editing an event */}
        {isEditing &&
          <div className="edit-event-form">
            <h2>Edit Event</h2>
            <form onSubmit={handleSubmit}>
              <label>
                Event Title:
                <input
                  type="text"
                  value={eventTitle}
                  onChange={e => setEventTitle (e.target.value)}
                  required
                />
              </label>
              <label>
                Event Date:
                <input
                  type="date"
                  value={eventDate}
                  onChange={e => setEventDate (e.target.value)}
                  required
                />
              </label>
              <label>
                Event Time:
                <input
                  type="time"
                  value={eventTime}
                  onChange={e => setEventTime (e.target.value)}
                  required
                />
              </label>
              <label>
                Address:
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress (e.target.value)}
                  required
                />
              </label>
              <label>
                Content:
                <textarea
                  value={content}
                  onChange={e => setContent (e.target.value)}
                  required
                />
              </label>
              <button type="submit">Update Event</button>
              <button type="button" onClick={cancelEdit}>Cancel</button>
            </form>
            {message && <div className="message">{message}</div>}
          </div>}

        {/* Show the event table when not editing */}
        {!isEditing &&
          eventFilter &&
          <div className="event-table">
            <h2>Events</h2>
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
                  <th>Actions</th>
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
                    <td>
                      <button onClick={() => handleEditEvent (event)}>
                        Edit
                      </button>
                      <button onClick={() => handleDeleteEvent (event.id)}>
                        Delete
                      </button>
                    </td>
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
      </div>
    </div>
  );
};

export default EventManagement;
