// src/Home.js

import React from 'react';
import { Link } from 'react-router-dom';
import "./Home.css";

const Home = () => {
    return (
        <div className="home-container">
            <h1 className="app-title">Welcome to Event Management</h1>
            <p className="app-description">Manage your events efficiently and effortlessly.</p>

            <div className="section admin-section">
                <h2>Admin Access</h2>
                <p>The login option is exclusively for admins. Admins can manage events and oversee user registrations.</p>
                <Link to="/login" className="btn">Admin Login</Link>
            </div>

            <div className="section user-section">
                <h2>User Registration</h2>
                <p>Users can register to participate in events. Please register below:</p>
                <Link to="/register" className="btn">User Registration</Link>
            </div>
        </div>
    );
};

export default Home;
