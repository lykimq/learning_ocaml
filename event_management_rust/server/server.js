require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.FRONTEND_PORT || 3000; // Use the port from .env or default to 3000

app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Routes
app.get('/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.post('/register', async (req, res) => {
    const { username, email } = req.body;
    try {
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rowCount > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        await pool.query('INSERT INTO users (username, email) VALUES ($1, $2)', [username, email]);
        res.status(201).json('User registered successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Start the server
const startServer = async () => {
    try {
        await app.listen(port);
        console.log(`Server running at http://localhost:${port}`);
    } catch (err) {
        console.error(`Error starting server on port ${port}:`, err);
    }
};

// Start the server
startServer();
