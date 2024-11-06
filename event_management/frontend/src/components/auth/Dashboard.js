import React from "react";
import { Link, useNavigate } from "react-router-dom";
import './Dashboard.css'

const Dashboard = () => {

    const naviage = useNavigate();

    const handleSignOut = () => {
        // Clear login status
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem("username")

        naviage("/")
    };

    return (
        <div className="dashboard-container">
            <h1 className="app-title">Welcome to Event Management Dashboard</h1>
            <p className="app-description">You are logged in. Choose an action below:</p>

            <div className="section event-section">
                <h2>Event Access</h2>
                <p>Admins can manage events from here. Please click below to register events.</p>
                {/*TODO": create a page to register login */}
                <Link to="/auth/login" className="btn"> Register Event</Link>
            </div>

            <div className="section user-section">
                <h2>User Registration</h2>
                <p>Admins can register users to participate in events or manage existing registrations.</p>
                <Link to="/users/register" className="btn"> User Registration</Link>
            </div>

            <button onClick={handleSignOut} className="btn sign-out">
                Sign Out
            </button>
        </div>
    )
}

export default Dashboard