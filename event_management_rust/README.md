# Specification of Event Management Application


1. User Roles
Admin:
Can create, edit, delete events.
Can manage user subscriptions.
Can choose notification channels (e.g., email, SMS, Google Calendar, WhatsApp).
Has access to user and event data, such as lists of registered users and event history.
User:
Can subscribe to events.
Can select their preferred notification channel(s).
Receives notifications based on their preferences.
2. Features
Core Features

User Registration and Authentication:
Secure user authentication (e.g., using JWT or OAuth for security).
Profile management for users to update notification preferences.
Event Creation and Management:
Admins can create and edit event details (title, description, date, location).
Events should have unique identifiers and scheduling options.
Notification System:
Email Notifications: Integrate with an email service provider (e.g., SendGrid, Amazon SES).
SMS Notifications: Integrate with an SMS provider (e.g., Twilio).
Google Calendar: Automatically add events to a user’s Google Calendar.
WhatsApp/Messenger Notifications: Integrate with platforms that support business APIs (e.g., WhatsApp Business API or Facebook Messenger API).
Optional Features

Dashboard for Admins:
Analytics on event participation and notifications.
Logs of notification delivery and user engagement.
Integration with Other Platforms (if needed in the future):
Option to add more notification channels (e.g., Telegram, Slack).
3. Feature Development Roadmap
Phase 1: Core User and Admin Functionality

User Registration and Authentication:
Set up secure registration and login for both users and admins.
Enable profile management where users can select their preferred notification channels.
Event Creation:
Develop an interface for admins to create, edit, and delete events.
Integrate validation to ensure accurate event dates and information.
Phase 2: Notification System

Email and SMS Integration:
Use an email service (e.g., SendGrid) for email notifications.
Integrate with SMS (e.g., Twilio) for phone messages.
Allow users to set their preferences for receiving email or SMS notifications.
Google Calendar Integration:
Set up Google Calendar API to add event reminders directly to users’ calendars.
Handle user OAuth to access Google Calendar.
WhatsApp/Messenger Integration:
Use WhatsApp Business API and Messenger API for event notifications.
Provide user options to select WhatsApp or Messenger as their preferred channel.
Phase 3: Advanced Features

Admin Dashboard and Analytics:
Develop an analytics dashboard for admins to track engagement.
Implement logs for delivery success and failure to troubleshoot notifications.
Push Notifications and Integration Expansion:
Optionally add push notifications if building a mobile version.
Allow for additional platform integrations as needed.
Technical Stack
Backend:

Programming Language: Rust (for performance and safety) or Node.js (for rapid development and rich library support).
Frameworks:
Rust: Actix-web or Rocket.
Node.js: Express.js or NestJS for modular applications.
Database: PostgreSQL for relational data (events, users, preferences).
Authentication: JWT for API token authentication; OAuth for Google integration.
Frontend:

Framework: React for a single-page application experience.
UI Frameworks: Material-UI or Bootstrap for consistent and responsive UI.
Third-Party Integrations:

Email: SendGrid, Mailgun, or Amazon SES.
SMS: Twilio or Nexmo.
Calendar: Google Calendar API.
Messaging: WhatsApp Business API, Facebook Messenger API.
Other Tools:

Push Notifications: Firebase Cloud Messaging for mobile or web push.
Containerization: Docker for deploying microservices.


---
# Side-nodes

```
curl -X POST http://localhost:3030/register -H "Origin: http://localhost:3001" -H "Content-Type: application/json" -d '{"username":"testuser","email":"test@example.com"}'
"User registered successfully."

quyen@🏵 :~/learning_occurl -X GET http://localhost:3030/usersGET http://localhost:3030/users
```


Run application

```
cd src/cargo build; cargo run
cd server/node server.js
cd frontend/src/npm install; npm start
```

Parallel run PostgresSQL as well as database.

## FireBase
To go to the Firebase Console, simply click here or type https://console.firebase.google.com/ into the browser's address bar.

name of project: EventManagement

```
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCUiMP1WAVFr8sfPDVwqeikU2EfPjR8cI0",
  authDomain: "eventmanagement-c5da8.firebaseapp.com",
  projectId: "eventmanagement-c5da8",
  storageBucket: "eventmanagement-c5da8.firebasestorage.app",
  messagingSenderId: "540064443166",
  appId: "1:540064443166:web:5ed62beb228229f5ba370f",
  measurementId: "G-620C05LT9E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
```