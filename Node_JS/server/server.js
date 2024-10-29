const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Use the DATABASE_URL from .env
});

app.use(cors());
app.use(express.json());

// Function to validate email format
const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Simple regex for email validation
    return regex.test(email);
};

// Endpoint to create a user
app.post('/api/users', async (req, res) => {
    const { username, email } = req.body;

    // Check if the email format is valid
    if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format.' });
    }

    try {
        // Check for existing username
        const usernameCheck = await pool.query('SELECT * FROM public.users WHERE username = $1', [username]);
        if (usernameCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Username already exists.' });
        }

        // Check for existing email
        const emailCheck = await pool.query('SELECT * FROM public.users WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Email already exists.' });
        }

        // Insert the user into the users table
        const result = await pool.query(
            'INSERT INTO public.users (username, email) VALUES ($1, $2) RETURNING *',
            [username, email]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to fetch all users
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM public.users');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to create an event
app.post('/api/events', async (req, res) => {
    const { content, event_time, userIds } = req.body;

    try {
        // Insert the event into the events table
        const eventResult = await pool.query(
            'INSERT INTO public.events (content, event_time) VALUES ($1, $2) RETURNING id',
            [content, event_time]
        );

        const eventId = eventResult.rows[0].id;

        // Insert user associations into the event_users table
        const eventUsersInsertPromises = userIds.map(userId =>
            pool.query(
                'INSERT INTO public.event_users (event_id, user_id) VALUES ($1, $2)',
                [eventId, userId]
            )
        );

        // Wait for all insertions to complete
        await Promise.all(eventUsersInsertPromises);

        res.status(201).json({ id: eventId, content, event_time, userIds });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to fetch all events
app.get('/api/events', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM public.events');
        res.json(result.rows);
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
