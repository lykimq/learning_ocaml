import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import './Dashboard.css'

const Dashboard = () => {

    const [notification, setNotification] = useState('');
    const [isSuccess, setIsSuccess] = useState('');
    const naviage = useNavigate();

    useEffect(() => {
        //check if user is already logged in
        const loggedInUser = localStorage.getItem('username');
        if (loggedInUser) {
            setNotification(`Welcome back, ${loggedInUser}`);
            setIsSuccess(true)
        } else {
            // If not logged in, redirect to login page
            naviage('/auth/login')
        }
    })

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

            {notification && (
                <p className={`notification ${isSuccess ? '' : 'error'}`}>
                    {notification}
                </p>
            )}

            <div className="section event-section">
                <h2>Event Access</h2>
                <p>Admins can manage events from here. Please click below to register events.</p>
                {/*TODO": create a page to manage events: dashboard of events: register event and show a list of event, etc. */}
                <Link to="/auth/login" className="btn"> Register Event</Link>
            </div>

            {/* TODO: when admin success login, he should have the option to register users and show a list of users. */}
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