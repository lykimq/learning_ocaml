# Developement Steps

1. Setup backend (OCaml)
- Create an OCaml server: using a web framework like Opium or Dream.
- Endpoints:
    - `POST /events`: create a new event (admin access).
    - `PUT /events/{id}`: Edit an existing event (admin access).
    - `DELETE /events/{id}`: Delete an event (admin access).
    - `GET /events`: List events (both admin and user access).
    - `POST /users`: Register or unsubscribe users.
- Integration Google Calendar API: to allow automated event creation and updates in user calendars. User Google's official API client for OCaml or directly handle OAuth 2.0 tokens for API calls.

2. Setup Database (PostgreSQL):
- Create tables:
    - `users`: To store user information, Google OAuthe tokens, subscription status.
    - `events`: To store event details (e.g., title, description, date, time, location).
    - `subscriptions`: To store the relationship between events and users.

3. Implement Frontend (React or Svelte):
- Admin Interface:
    - A form for creating and editing events.
    - An interface for viewing, updating, and deleting events.
- User Interface:
    - Simple registration screen that prompts users to connect with Google Calendar.
    - Option to unsubscribe.

4. Integrate Google OAuth and Google Calendar API
- OAuth for Login:
    - Set up Google OAuth 2.0 for secure user and admin login.
- Calendar API:
    - Implement functionality to create, update, and delete events on users' Google Calendars through API calls.
- Event Updates:
    - When events are modified, use Google Calendar API to update the event for all users who are subscribed.

5. Deployment
- Backend: Deploy the OCaml server using a cloud provider like AWS or DigitalOcean.
- Database: Host the PostgreSQL database, ensuring secure access.
- Frontend: Host the frontend as a static site (e.g., Vercel, Netlify.)
