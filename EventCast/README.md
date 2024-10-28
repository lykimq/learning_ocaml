# Event Cast - Broadcasting events to users

## Specifications

## Core Functionalities

- Event Management: Admin can create, edit and delete events.
    - Event details include: content, time, date and any other relevant information.

- Google Calendar Integration: Use Google Calendar API to automatically create or update events on users' calendars.

- User Registration: Users can register by linking their Google account, allowing automatic event creation on their calendar.

- Subscription/Unsubscription: Users can subscribe to events to receive calendar updates or unsubscribe to stop receiveing updates.

## User Roles

- Admin:
    - Secure login to access event management interface.
    - Ability to create new events.
    - Capability to edit or delete events, automatically updating user calendars when changes are made.

- User:
    - Simple registration by linking their Google account.
    - Option to unsubscribe at any time, removing the integration with their Google calendar.

## Technology Stack
1. Backend:
- OCaml: for the backend API to manage events, handle Google Calendar API integration, and manage database interactions.

2. Frontend
- Javascript (React or Svelte)

3. Database:
- PostgreSQL.

4. Authentication
- OAuth 2.0 with Google: Google's OAuth 2.0 can manage both admin and user authentication and allow users to link their Google Calendar directly.

5. API Integrations:
- Google Calendar API: For creating, updating, and deleting events on users' calendars.