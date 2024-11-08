import React, {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import './EventRegister.css'; // Import the CSS file

const EventRegister = () => {
  const [eventTitle, setEventTitle] = useState ('');
  const [eventDate, setEventDate] = useState ('');
  const [eventTime, setEventTime] = useState ('');
  const [address, setAddress] = useState ('');
  const [content, setContent] = useState ('');
  const [message, setMessage] = useState ('');

  const navigate = useNavigate ();

  // Add/edit event function
  const handleSubmit = async e => {
    e.preventDefault ();
    const url = `${process.env.REACT_APP_BACKEND_URL}/events/add`;
    const method = 'POST';

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

      setMessage ('Event added successfully.');
      setEventTitle ('');
      setEventDate ('');
      setEventTime ('');
      setAddress ('');
      setContent ('');
    } catch (error) {
      setMessage ('An error occurred. Please try again.');
    }
  };

  const handleSignOut = () => {
    // Clear login status
    localStorage.removeItem ('isLoggedIn');
    localStorage.removeItem ('username');
    localStorage.removeItem ('isAdmin');

    navigate ('/');
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
        <div className="container-register">
          <h2>{'Add Event'}</h2>
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
            <button type="submit">{'Add'} Event</button>
          </form>
          {message && <div className="message">{message}</div>}
        </div>
      </div>
    </div>
  );
};

export default EventRegister;
