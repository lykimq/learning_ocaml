import React from 'react';
import {Link, useNavigate} from 'react-router-dom';
import './EventDashboard.css';

const EventDashboard = () => {
  const navigate = useNavigate ();

  const handleSignOut = () => {
    // Clear login status
    localStorage.removeItem ('isLoggedIn');
    localStorage.removeItem ('username');
    localStorage.removeItem ('isAdmin');

    navigate ('/');
  };

  return (
    <div className="event-dashboard-container">
      <h1 className="app-title"> Event Management </h1>
      <p className="app-description">
        Choose an action below to manage your events.
      </p>

      <button onClick={handleSignOut} className="sign-out-button">
        Sign Out
      </button>

      <p>
        <Link to="/">Back to Dashboard</Link> {/* Link to home */}
      </p>

      <div className="section event-section">
        <h2>Add New Event</h2>
        <p>
          Click here to add a new event to the system. Fill in the event details and submit it for approval.
        </p>
        <Link to="/events/add" className="btn">Add New Event</Link>
      </div>

      <div className="section event-section">
        <h2>Show All Events</h2>
        <p>
          View the list of all events. You can also edit or delete events from this page.
        </p>
        <Link to="/events/list" className="btn">Show All Events</Link>
      </div>

      <div className="section event-section">
        <h2>Past Events</h2>
        <p>
          View all events that have already occurred. This page will show the history of past events.
        </p>
        <Link to="/events/past" className="btn">Past Events</Link>
      </div>

      <div className="section event-section">
        <h2>Current Events</h2>
        <p>
          Check out the events that are currently happening. You can manage active events from here.
        </p>
        <Link to="/events/current" className="btn">Current Events</Link>
      </div>

      <div className="section event-section">
        <h2>Future Events</h2>
        <p>
          Browse upcoming events and plan for the future. You can manage future events here.
        </p>
        <Link to="/events/future" className="btn">Future Events</Link>
      </div>

      <div className="section event-section">
        <h2>Edit Event</h2>
        <p>
          Edit the details of existing events, such as title, date, and location.
        </p>
        <Link to="/events/edit" className="btn">Edit Event</Link>
      </div>

      <div className="section event-section">
        <h2>Delete Event</h2>
        <p>
          Remove an event from the system by clicking below. Be cautious as this action is irreversible.
        </p>
        <Link to="/events/delete" className="btn">Delete Event</Link>
      </div>
      <p>
        <Link to="/">Back to Dashboard</Link> {/* Link to home */}
      </p>

    </div>
  );
};

export default EventDashboard;
