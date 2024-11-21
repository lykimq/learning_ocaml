#!/bin/bash

# Database name
DB_NAME="church_app_events"

# Connect to PostgreSQL and create the database if it doesn't exist
psql -U postgres -c "CREATE DATABASE $DB_NAME;"

# Connect to the database and create the tables
psql -U postgres -d $DB_NAME << EOF

-- Create ENUM type for user status
CREATE TYPE user_role AS ENUM ('admin', 'user');


-- Create Users table
CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    profile_picture TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Events table
CREATE TABLE Events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    location VARCHAR(255),
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE SET NULL
);

-- Create the ENUM type for RSVP status
CREATE TYPE rsvp_status AS ENUM ('pending', 'confirmed', 'declined');

-- Create EventRSVP table
CREATE TABLE EventRSVP (
    user_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    rsvp_status rsvp_status DEFAULT 'pending',  -- Use the created ENUM type
    PRIMARY KEY (user_id, event_id),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES Events(id) ON DELETE CASCADE
);

-- Create HomeGroups table
CREATE TABLE HomeGroups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE SET NULL
);


-- Create Serving table
CREATE TABLE Serving (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE SET NULL
);

-- Create ENUM type for RSVP status
CREATE TYPE signup_status AS ENUM ('pending', 'confirmed', 'declined');

-- Create ServingSignups table (many-to-many relationship)
CREATE TABLE ServingSignups (
    user_id INTEGER NOT NULL,
    serving_id INTEGER NOT NULL,
    signup_status signup_status DEFAULT 'pending',
    PRIMARY KEY (user_id, serving_id),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (serving_id) REFERENCES Serving(id) ON DELETE CASCADE
);

EOF

echo "Tables created successfully in database $DB_NAME."
