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

## Workflow
- Default User Role:
    - When the app opens, it should directly show user features without requiring a login.
    - Admin-specific features should not be visible or accessible to a user.

- Admin Role:
    - Admins must log in to access admin-specific features like managing events, media, homegroups, etc.
    - Logging out should revert the app to user mode.

### Application mode
- The app defaults to UserNavigator (user mode) without requiring a login.
- LoginScreen should be hidden in user mode and only accessible for admin login.
- When an admin logs in:
    - Switch to AdminNavigator (admin mode).
    - Display a logout option for the admin to return to user mode.
- Admin-specific features should only appear in AdminNavigator, while user features remain in UserNavigator.



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