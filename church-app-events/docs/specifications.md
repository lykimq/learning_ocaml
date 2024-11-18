# Specifications of church application mobile

## Key Features
### 1. Admin Panel:

- Manage Events (CRUD operations).
- Manage Media (Upload/Delete).
- View and Edit Users (Role Management).
- Send Notifications (Broadcast to all users).
- Analytics Dashboard (App usage and giving reports).

### 2. User Features:

- View and RSVP for Events.
- Access Media (Watch/Listen).
- Make Donations (Secure payments).
- Join Groups and Serving Opportunities.
- Receive Notifications.
- Manage Profile (View/Update user details).

## Technologies
- Frontend: React Native with Expo (shared for web, Android, iOS).
- Backend: Actix-web (Rust) or Node.js for APIs.
- Database: PostgreSQL (for relational data storage).
- Cloud Services:
    - Firebase Authentication (for user login).
    - Firebase Storage/AWS S3 (for media files).
    - Firebase Notifications or Expo Notifications.
- Payment Integration: Stripe or PayPal (for donations).
- Hosting:
    - Backend: Fly.io, Heroku, or AWS.
    - Web: Vercel or Netlify.