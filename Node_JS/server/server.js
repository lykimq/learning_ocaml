const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


// Create a new event
app.post('/api/events', async (req, res) => {
    const { content, event_time, user_id } = req.body;
    const result = await pool.query('INSERT INTO events (content, event_time, user_id) VALUES ($1, $2, $3) RETURNING *', [content, event_time, user_id]);
    res.json(result.rows[0]);
});

// Get all events
app.get('/api/events', async (req, res) => {
    const result = await pool.query('SELECT * FROM events');
    res.json(result.rows);
});

// Update an event
app.put('/api/events/:id', async (req, res) => {
    const { id } = req.params;
    const { content, event_time } = req.body;
    const result = await pool.query('UPDATE events SET content = $1, event_time = $2 WHERE id = $3 RETURNING *', [content, event_time, id]);
    res.json(result.rows[0]);
});

// Delete an event
app.delete('/api/events/:id', async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM events WHERE id = $1', [id]);
    res.sendStatus(204);
});


// Create a new user
app.post('/api/users', async (req, res) => {
    const { username, email } = req.body;
    const result = await pool.query('INSERT INTO users (username, email) VALUES ($1, $2) RETURNING *', [username, email]);
    res.json(result.rows[0]);
});

// Get all users
app.get('/api/users', async (req, res) => {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
});
