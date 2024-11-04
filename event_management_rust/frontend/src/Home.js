import React from "react";
import { Link } from "react-router-dom"
import "./Home.css"
import Login from "./Login";

function Home() {
    return (
        <div className="home-container">
            <h2 className="home-title">Welcome to Event Management</h2>
            <p className="home-description">An application to manage events efficiently.</p>
            <div className="login-section">
                <Login />
            </div>
        </div>
    )

}

export default Home;