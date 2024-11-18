# Services - CRUD (Create - Read - Update - Delete)

Purpose: Handles all API communication and business logic for the app.

## 1. Event Service
`eventService.js`: Handles fetching, adding, updating, and deleting events. Used by admin to manage events and users to view events.

### Admin CRUD Operations
- Create Event: Admin can create new events.
    - `POST /admin/events`
- Read Event: Admin can view all events.
    - `GET /admin/events`
- Update Event: Admin can edit details of existing events
    - `PUT /admin/events/:id`
- Delete Event: Admin can delete events.
    - `DELETE /admin/events/:id`

### User CRUP Operations
- Read Event: Users can view all events (upcoming, past and details)
    - `GET /user/events`
- RSVP for Event: Users can RSVP or register for an event they are interested in (could be done via a "sign-up" feature).
    - `POST /user/events/:id/rsvp`
- View Event Details: Users can view specific event details (event description, etc.)
    - `GET /user/events/:id`

---

## 2. Home Group Service
- `homeGroupService.js`: Handles CRUD operations for home groups. Used by admin to manage home groups and users to view/join groups.

### Admin CRUD Operations
- Create Home Group: Admin can create new home groups
    - `POST /admin/homegroups`

- Read Home Groups: Admin can view all home groups
    - `GET /admin/homegroups`

- Update Home Group: Admin can edit details of an existing home group
    - `PUT /admin/homegroups/:id`

- Delete Home Group: Admin can delete a home group
    - `DELETE /homegroups/:id`

### User CRUD Operations
- Read Home Group: Users can view all available home groups (to join or get details)
    - `GET /user/homegroups`

- Join Home Group: Users can join a home group.
    - `POST /user/homegroups/:id/join`

- View Home Group Details: Users can view the details of a specific home group.
    -  `GET /user/homegroups/:id`

---

## 3. Media Service
- `mediaService.js`: Handles CRUD operations for media, including uploading and retrieving media.

### Admin CRUD Operations
- Upload Media: Admin can upload media content (e.g, images, video, sermons.)
    - `POST /admin/media`

- Read Media: Admin can view all uploaded media
    - `GET /admin/media`

- Update Media: Admin can edit the metadata of uploaded media
    - `PUT /admin/media/:id`

- Delete Media: Admin can delete uploaded media.
    - `DELETE /admin/media/:id`

### User CRUD Operations
- Read Media: Users can view available media
    - `GET /user/media`

- Download Media: Users can download or stream available media content
    - `GET /user/media/:id/download`

- View Media Details: Users can view details of a specific media item
    - `GET /user/media/:id`

---

## 4. Serving Service
- `servingService.js`: Handles CRUD operations for serving opportunities, allowing both users and admins to view and manage serving.

### Admin CRUD Operations
- Create Serving Opportunity: Admin can create new serving opportunitites
    - `POST /admin/serving`

- Read Serving Opportunity: Admin can view all serving opportunities
    - `GET /admin/serving`

- Update Serving Opportunity: Admin can edit details of a serving opportunity
    - `PUT /admin/serving/:id`

- Delete Serving Opportunity: Admin can remove a serving opportunity
    - `DELETE /admin/serving/:id`


### User CRUD Operations
- Read Serving Opportunities: Users can view available serving opportunities
    - `GET /user/serving`

- Sign Up for Serving: Users can sign up to serve in a particular opportunity
    - `POST /user/serving/:id/signup`

- View Serving Details: Users can view details of a specific serving opportunity
    - `GET /user/serving/:id`

---

## 5. Login Service
- `loginService.js`: Handles login and registration logic, including Google login or email-based authentication.

### Admin and User CRUD Operations
- Login: Both admin and user can log in with their crenditials (email or Google account)
    - `POST /login`

- Register: Admins and users can create new account (sign-up)
    - `POST /register`

- Logout: Both admin and user can log out of the app (invalidate session)
    - `POST /logout`

- Update Profile: Users and admins can update their profile (change name, email, password, etc.)
    - `PUT /profile`

- Reset Password: Users can request to rest their password via email.
    - `POST /password-reset`

- Verify Email: Admin verifies user emails for account activation.
    - `POST /verify-email`


---

## Summary of CRUD Operations
# Services - CRUD (Create - Read - Update - Delete)

## Summary Table

| **Service**         | **Admin**                                           | **User**                                          | **CRUD Operations Path**                          |
|---------------------|-----------------------------------------------------|---------------------------------------------------|---------------------------------------------------|
| **Event Service**    | Create, Read, Update, Delete                        | Read, RSVP, View Event Details                    | **Admin**:                                        |
|                     |                                                     |                                                   | `POST /admin/events`                              |
|                     |                                                     |                                                   | `GET /admin/events`                               |
|                     |                                                     |                                                   | `PUT /admin/events/:id`                           |
|                     |                                                     |                                                   | `DELETE /admin/events/:id`                        |
|                     |                                                     |                                                   | **User**:                                         |
|                     |                                                     |                                                   | `GET /user/events`                                |
|                     |                                                     |                                                   | `POST /user/events/:id/rsvp`                      |
|                     |                                                     |                                                   | `GET /user/events/:id`                            |
| **Home Group Service** | Create, Read, Update, Delete                      | Read, Join, View Home Group Details               | **Admin**:                                        |
|                     |                                                     |                                                   | `POST /admin/homegroups`                          |
|                     |                                                     |                                                   | `GET /admin/homegroups`                           |
|                     |                                                     |                                                   | `PUT /admin/homegroups/:id`                       |
|                     |                                                     |                                                   | `DELETE /admin/homegroups/:id`                    |
|                     |                                                     |                                                   | **User**:                                         |
|                     |                                                     |                                                   | `GET /user/homegroups`                            |
|                     |                                                     |                                                   | `POST /user/homegroups/:id/join`                  |
|                     |                                                     |                                                   | `GET /user/homegroups/:id`                        |
| **Media Service**    | Upload, Read, Update, Delete                        | Read, Download, View Media Details                | **Admin**:                                        |
|                     |                                                     |                                                   | `POST /admin/media`                               |
|                     |                                                     |                                                   | `GET /admin/media`                                |
|                     |                                                     |                                                   | `PUT /admin/media/:id`                            |
|                     |                                                     |                                                   | `DELETE /admin/media/:id`                         |
|                     |                                                     |                                                   | **User**:                                         |
|                     |                                                     |                                                   | `GET /user/media`                                 |
|                     |                                                     |                                                   | `GET /user/media/:id/download`                    |
|                     |                                                     |                                                   | `GET /user/media/:id`                             |
| **Serving Service**  | Create, Read, Update, Delete                        | Read, Sign Up, View Serving Details               | **Admin**:                                        |
|                     |                                                     |                                                   | `POST /admin/serving`                             |
|                     |                                                     |                                                   | `GET /admin/serving`                              |
|                     |                                                     |                                                   | `PUT /admin/serving/:id`                          |
|                     |                                                     |                                                   | `DELETE /admin/serving/:id`                       |
|                     |                                                     |                                                   | **User**:                                         |
|                     |                                                     |                                                   | `GET /user/serving`                               |
|                     |                                                     |                                                   | `POST /user/serving/:id/signup`                   |
|                     |                                                     |                                                   | `GET /user/serving/:id`                           |
| **Login Service**    | Register, Login, Logout, Update Profile            | Register, Login, Logout, Update Profile          | **Both Admin & User**:                            |
|                     |                                                     |                                                   | `POST /login`                                     |
|                     |                                                     |                                                   | `POST /register`                                  |
|                     |                                                     |                                                   | `POST /logout`                                    |
|                     |                                                     |                                                   | `PUT /profile`                                    |
|                     |                                                     |                                                   | `POST /password-reset`                            |
|                     |                                                     |                                                   | `POST /verify-email`                              |
