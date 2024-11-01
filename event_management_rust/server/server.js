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

// Fetch all users with optional sorting
app.get('/users', async (req, res) => {
    const { sortBy } = req.query; // Extract sort parameter from query

    // Determine the sorting clause based on the sortBy parameter
    let sortClause = '';
    if (sortBy) {
        // Sanitize input to prevent SQL injection
        if (sortBy === 'username' || sortBy === 'email') {
            sortClause = `ORDER BY ${sortBy}`;
        } else {
            return res.status(400).json({ error: 'Invalid sort parameter' });
        }
    }

    try {
        const result = await pool.query(`SELECT * FROM users ${sortClause}`);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Register a new user
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

// Edit an existing user
app.put('users/:id/edit', async (req, res) => {
    const { id } = req.params;
    const { username, email } = req.body;
    try {
        await pool.query('UPDATE users SET username = $1, email = $2 WHERE id = $3', [username, email, id]);
        res.json('User updated successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to update user')

    }
})

// Delete a user
app.delete('users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        res.json('User deleted successfully.')
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to delete user')
    }
})

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
