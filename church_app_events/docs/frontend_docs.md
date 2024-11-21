# Front-end - Expo React-Native

## Folder Structure

### assets
- Purpose: contains all static assets (images, icons) used trhoughout the app.


### components

- Purpose: Reusable components used across multiple screens.

    - `Header.js`: A header component that displays the app's title or navigation items. It can be used in both admin and user screens for consistent top navigation.

    - `HomeGroupForm.js`: A form component for creating or editing a home group. This can include inputs for the group name, description, and leader. It can be used both for user and admin screens.

    - `HomeGroupCard.js`: A card component displaying details of a home group (e.g., name, leader, description). Used in `HomeGroupScreen.js` for users and `ManageHomeGroupsScreen.js` for admin.

    - `MediaCard.js`: A card component displaying media details (e.g., image, video title). Used in `MediaScreen.js` for users and `ManageMediaScreen.js` for admin.

    - `ServingCard.js`: A card component for displaying serving opportunities. Used in `ServingScreen.js` for users and `ManageServingScreen.js` for admin.

### config

- Purpose: Stores configuration files such as API URLs or global constants.

    - `api.js`: Contains the base URL for the API and common headers used for all requests. It centralizes API-related configurations.

### navigation

- Purpose: Manages the navigation logic for the app.

    - `AdminNavigator.js`: Contains navigation for admin-specific features such as managing events, users, home groups, etc.

    - `UserNavigator.js`: Contains navigation for user-specific screens, including event listings, media, home groups, and serving opportunities.

    - `AuthNavigator.js`: Handles the navigation related to authentication (e.g., login, registration).

### screens

- Purpose: Contains screen components for each page of the app.

    - admin/:

        - `DashboardScreen.js`: Admin’s main screen to manage the overall app, monitor activity, and quick access to admin features.

        - `ManageEventsScreen.js`: Admin screen to create, update, or delete events. It interacts with the `eventService.js` to manage event data.

        - `ManageServingScreen.js`: Admin screen to manage serving opportunities (add/edit/remove).

        - `ManageMediaScreen.js`: Admin screen to manage media (view, add, remove).

        - `ManageHomeGroupScreen.js`: Admin screen to manage homegroups (view, add, remove).

        - `ManageUsersScreen.js`: Admin screen to manage users (view, add, remove).

    -  shared/:

        - `LoginScreen.js`: A shared login screen for both admins and users to authenticate with the app.

        - `ProfileScreen.js`: A shared profile screen for users and admins to view and edit their profile.

    - user/:

        - `EventScreen.js`: User screen to view the list of events.

        - `HomeGroupScreen.js`: User screen to view and join home groups.

        - `MediaScreen.js`: User screen to view available media (e.g., videos, images).

        - `ServingScreen.js`: User screen to view available serving opportunities.

        - `EventScreen.js`: User screen to view available serving opportunities.

### services

- Purpose: Handles all API communication and business logic for the app.

    - `eventService.js`: Handles fetching, adding, updating, and deleting events. Used by admin to manage events and users to view events.

    - `homeGroupService.js`: Handles CRUD operations for home groups. Used by admin to manage home groups and users to view/join groups.

    - `loginService.js`: Handles login and registration logic, including Google login or email-based authentication.

    - `mediaService.js`: Handles CRUD operations for media, including uploading and retrieving media.

    - `servingService.js`: Handles CRUD operations for serving opportunities, allowing both users and admins to view and manage serving.

### ui
- Purpose: Contains common UI components that can be used across various screens.

