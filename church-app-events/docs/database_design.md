# Database Design - PostgreSQL


## 1. Users

- Contains information about users (both admin and regular users).
- Used for authentication, profiles, and user-related data.

```sql
CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') NOT NULL,
    profile_picture TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
### Fields
- `id (SERIAL, Primary Key)`: A unique identifier for each user.
- `email (VARCHAR(255), Unique, NOT NULL)`: The user's email address, which must be unique.
- `password_hash (TEXT, NOT NULL)`: The hashed password for user authentication.
- `name (VARCHAR(255), NOT NULL)`: The full name of the user.
- `role (ENUM('admin', 'user'), NOT NULL)`: Defines the role of the user, either 'admin' or 'user'.
- `profile_picture (TEXT)`: A URL or path to the user's profile picture.
- `created_at (TIMESTAMP, Default CURRENT_TIMESTAMP)`: The timestamp of when the user was created.
- `updated_at (TIMESTAMP, Default CURRENT_TIMESTAMP)`: The timestamp of when the user data was last updated.

### Relationships
- One-to-many with Events: One user (admin) can create multiple events.
- One-to-many with HomeGroups: One user (admin) can create multiple home groups.
- One-to-many with Media: One user (admin) can upload multiple media items.
- One-to-many with Serving: One user (admin) can create multiple serving opportunities.
- Many-to-many with Events (via EventRSVP): Users can RSVP for multiple events.
- Many-to-many with Serving (via ServingSignups): Users can sign up for multiple serving opportunities.

### Required Fields
- `email`: The email address of the user, unique for each user. Required for authentication.
- `password_hash`: The hashed password used for user authentication. Required for login.
- `name`: The full name of the user. Required for user profiles.
- `role`: Defines whether the user is an 'admin' or a 'user'. Required for user role management.

### Optional Fields:
- `profile_picture`: The URL or path to the user's profile picture. Optional, users may choose not to upload a picture.
- `created_at`: Automatically generated timestamp when the user is created. Handled by the system.
- `updated_at`: Automatically updated timestamp when the user's data changes. Handled by the system.

## 2. Events
- Stores event details like date, location, description, etc.
- Admins can create, update, and delete events.

```sql
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
```

### Fields
- `id (SERIAL, Primary Key)`: A unique identifier for each event.
- `title (VARCHAR(255), NOT NULL)`: The title of the event.
- `description (TEXT)`: A detailed description of the event.
- `start_date (TIMESTAMP, NOT NULL)`: The start date and time of the event.
- `end_date (TIMESTAMP, NOT NULL)`: The end date and time of the event.
- `location (VARCHAR(255))`: The location where the event takes place.
- `created_by (INTEGER, NOT NULL)`: Foreign key linking to the Users table, representing the admin who created the event.
- `created_at (TIMESTAMP, Default CURRENT_TIMESTAMP)`: Timestamp of when the event was created.
- `updated_at (TIMESTAMP, Default CURRENT_TIMESTAMP)`: Timestamp of when the event was last updated.

### Relationships
- Many-to-one with Users (created_by): Each event is created by one admin.
- Many-to-many with Users (via EventRSVP): Users can RSVP to multiple events.

### Required Fields:
- `title`: The name of the event. Required for display and identification.
- `start_date`: The date and time when the event starts. Required for event scheduling.
- `end_date`: The date and time when the event ends. Required for event scheduling.
- `created_by`: The admin who created the event. Required for associating the event with an admin.

### Optional Fields:
- `description`: A detailed description of the event. Optional, can be empty.
- `location`: The physical or virtual location of the event. Optional, can be empty if not needed.
- `created_at`: Automatically generated timestamp when the event is created. Handled by the system.
- `updated_at`: Automatically updated timestamp when the event details are changed. Handled by the system.

## 3. HomeGroups
- Stores details about different home groups (e.g., group name, description, etc.).
- Admins manage groups, and users can join them.

```sql
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
```

### Fields:
- `id (SERIAL, Primary Key)`: A unique identifier for each home group.
- `name (VARCHAR(255), NOT NULL)`: The name of the home group.
- `description (TEXT)`: A description of the group.
- `location (VARCHAR(255))`: Physical or online location of the group.
- `created_by (INTEGER, NOT NULL)`: Foreign key linking to the Users table, representing the admin who created the home group.
- `created_at (TIMESTAMP, Default CURRENT_TIMESTAMP)`: Timestamp of when the home group was created.
- `updated_at (TIMESTAMP, Default CURRENT_TIMESTAMP)`: Timestamp of when the home group was last updated.

### Relationships:
- Many-to-one with Users (created_by): Each home group is created by one admin.

### Required Fields:
- `name`: The name of the home group. Required for identification.
- `created_by`: The admin who created the home group. Required for associating the group with an admin.

### Optional Fields:
- `description`: A description of the home group. Optional, can be empty.
- location: The physical or online location of the home group. Optional, can be empty.
- `created_at`: Automatically generated timestamp when the home group is created. Handled by the system.
- `updated_at`: Automatically updated timestamp when the home group details are changed. Handled by the system.

## 4. Media
- Stores media items (e.g., videos, images, audio).
- Admins can upload, edit, and delete media.

```sql
CREATE TABLE Media (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    uploaded_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES Users(id) ON DELETE SET NULL
);
```
### Fields

- `id (SERIAL, Primary Key)`: A unique identifier for each media item.
- `title (VARCHAR(255), NOT NULL)`: The title of the media item.
- `description (TEXT)`: A description of the media item.
- `file_url (TEXT, NOT NULL)`: URL or path to where the media is stored.
- `uploaded_by (INTEGER, NOT NULL)`: Foreign key linking to the Users table, representing the admin who uploaded the media.
- `created_at (TIMESTAMP, Default CURRENT_TIMESTAMP)`: Timestamp of when the media item was uploaded.
- `updated_at (TIMESTAMP, Default CURRENT_TIMESTAMP)`: Timestamp of when the media item was last updated.

### Relationships
- Many-to-one with Users (uploaded_by): Each media item is uploaded by one admin.

### Required Fields
- `title`: The title of the media item. Required for identification.
- `file_url`: The URL or path to where the media is stored. Required to access the media content.
- `uploaded_by`: The admin who uploaded the media. Required for associating media with an admin.

### Optional Fields
- `description`: A description of the media item. Optional, can be empty.
- `created_at`: Automatically generated timestamp when the media item is uploaded. Handled by the system.
- `updated_at`: Automatically updated timestamp when the media item is changed. Handled by the system.

## 5. Serving
- Stores details of serving opportunities in the church (e.g., volunteer roles).
- Admins manage serving, and users can sign up to serve.

```sql
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
```

### Fields
- `id (SERIAL, Primary Key)`: A unique identifier for each serving opportunity.
- `title (VARCHAR(255), NOT NULL)`: The title of the serving opportunity.
- `description (TEXT)`: A detailed description of the serving opportunity.
- `location (VARCHAR(255))`: Location of the serving activity.
- `created_by (INTEGER, NOT NULL)`: Foreign key linking to the Users table, representing the admin who created the serving opportunity.
- `created_at (TIMESTAMP, Default CURRENT_TIMESTAMP)`: Timestamp of when the serving opportunity was created.
- `updated_at (TIMESTAMP, Default CURRENT_TIMESTAMP)`: Timestamp of when the serving opportunity was last updated.

### Relationships
- Many-to-one with Users (created_by): Each serving opportunity is created by one admin.
- Many-to-many with Users (via ServingSignups): Users can sign up for multiple serving opportunities.

### Required Fields
- `title`: The title of the serving opportunity. Required for identification.
- `created_by`: The admin who created the serving opportunity. Required for associating the opportunity with an admin.

### Optional Fields
- `description`: A detailed description of the serving opportunity. Optional, can be empty.
- `location`: The location where the serving activity takes place. Optional, can be empty.
- `created_at`: Automatically generated timestamp when the serving opportunity is created. Handled by the system.
- `updated_at`: Automatically updated timestamp when the serving opportunity details are changed. Handled by the system.

## 6. EventRSVP
- Contains the relationship between users and events they RSVP for.
- Users can RSVP to events, and the list of RSVPs is stored here.

```sql
CREATE TABLE EventRSVP (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    rsvp_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES Events(id) ON DELETE CASCADE
);
```

### Fields
- `id (SERIAL, Primary Key)`: A unique identifier for each RSVP.
- `user_id (INTEGER, NOT NULL)`: Foreign key linking to the Users table, representing the user who RSVP'd.
- `event_id (INTEGER, NOT NULL)`: Foreign key linking to the Events table, representing the event the user RSVP'd to.
- `rsvp_date (TIMESTAMP, Default CURRENT_TIMESTAMP)`: The timestamp of when the user RSVP'd for the event.

### Relationships
- Many-to-one with Users (user_id): Each RSVP is made by one user.
- Many-to-one with Events (event_id): Each RSVP corresponds to one event.

### Required Fields
- `user_id`: The user who is RSVPing for the event. Required to identify the user.
- `event_id`: The event that the user RSVP'd for. Required to identify the event.

### Optional Fields
- `rsvp_date`: The timestamp of when the user RSVP'd. Handled by the system.


## 7. ServingSignups
- Links users to the serving opportunities they have signed up for.
- A user can sign up for multiple serving roles.

```sql
CREATE TABLE ServingSignups (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    serving_id INTEGER NOT NULL,
    signup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (serving_id) REFERENCES Serving(id) ON DELETE CASCADE
);
```

### Fields
- `id (SERIAL, Primary Key)`: A unique identifier for each signup.
- `user_id (INTEGER, NOT NULL)`: Foreign key linking to the Users table, representing the user who signed up.
- `serving_id (INTEGER, NOT NULL)`: Foreign key linking to the Serving table, representing the serving opportunity the user signed up for.
- `signup_date (TIMESTAMP, Default CURRENT_TIMESTAMP)`: The timestamp of when the user signed up for the serving opportunity.

### Relationships
- Many-to-one with Users (user_id): Each signup is made by one user.
- Many-to-one with Serving (serving_id): Each signup corresponds to one serving opportunity.

### Required Fields
- `user_id`: The user who signed up for the serving opportunity. Required to identify the user.
- `serving_id`: The serving opportunity the user signed up for. Required to identify the serving opportunity.

### Optional Fields
- `signup_date`: The timestamp of when the user signed up. Handled by the system.