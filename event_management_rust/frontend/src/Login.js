import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"
import "./Login.css"

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("http://localhost:3030/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                setMessage(errorMessage)
                return;

            }

            setMessage("Login successfully.")

            // Go to the user registration and events option page


        } catch (error) {
            setMessage('An error occurred. Please try again.')

        }
    }


    return (
        <div className="login-form">
            <h3>Login</h3>
            <form onSubmit={handleLogin}>
                <label>
                    Email:
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </label>
                <label>
                    Password:
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </label>
                <button type="submit">Login</button>
            </form>
            {message && <p className="login-message">{message}</p>}

            {/* Sign Up Link */}
            <p className="signup-option">
                Don't have an account? <Link to="/register-user">Sign up here</Link>
            </p>
        </div>
    );
};

export default Login;