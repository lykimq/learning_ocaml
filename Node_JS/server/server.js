const express = require('express');
const axios = require('axios'); // Use axios for HTTP requests
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
app.use(cors());
app.use(express.json());

// Base URL for Rust backend
const RUST_API_URL = process.env.RUST_API_URL || 'http://localhost:8000'; // Change to your Rust server URL

// Endpoint to create a user
app.post('/api/users', async (req, res) => {
    const { username, email } = req.body;

    try {
        // Forward request to Rust backend
        const response = await axios.post(`${RUST_API_URL}/api/users`, { username, email });
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error creating user:', error);
        if (error.response) {
            res.status(error.response.status).json({ error: error.response.data.error });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

// Endpoint to fetch all users
app.get('/api/users', async (req, res) => {
    try {
        // Forward request to Rust backend
        const response = await axios.get(`${RUST_API_URL}/api/users`);
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to create an event
app.post('/api/events', async (req, res) => {
    const { content, event_time, userIds } = req.body;

    try {
        // Forward request to Rust backend
        const response = await axios.post(`${RUST_API_URL}/api/events`, { content, event_time, userIds });
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error creating event:', error);
        if (error.response) {
            res.status(error.response.status).json({ error: error.response.data.error });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

// Endpoint to fetch all events
app.get('/api/events', async (req, res) => {
    try {
        // Forward request to Rust backend
        const response = await axios.get(`${RUST_API_URL}/api/events`);
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start the server
const PORT = process.env.PORT || 5000; // Use PORT from .env or default to 5000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
