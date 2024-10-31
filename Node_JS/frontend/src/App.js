import React from 'react';
import UserManagement from './UserManagement';
import EventManagement from './EventManagement';
import { BrowserRouter as Router, Route, Link, Routes } from 'react-router-dom';

const App = () => {
    return (
        <Router>
            <div>
                <h1>Event Management</h1>
                <nav>
                    <Link to="/">Users</Link>
                    <Link to="/events">Events</Link>
                </nav>
                <Routes>
                    <Route path="/" element={<UserManagement />} />
                    <Route path="/events" element={<EventManagement />} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;
