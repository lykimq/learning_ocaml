import React from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'; // Ensure Navigate is imported
import Login from './components/auth/Login';
import UserRegistration from './components/users/UserRegistration';
import Home from './components/Home';
import Dashboard from './components/auth/Dashboard';
import SignUp from './components/auth/SignUp';
import UserList from './components/users/UserList';
import EventDashboard from './components/events/EventDashboard';
import EventManagement from './components/events/EventManagement';
import EventRegister from './components/events/EventRegister';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Login */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<SignUp />} />
        <Route path="/auth/dashboard" element={<Dashboard />} />

        {/* Users: user */}
        <Route path="/users/register" element={<UserRegistration />} />
        {/* Users: admin */}
        <Route path="/users/admin/register" element={<UserList />} />

        {/* Event */}
        <Route path="/events/dashboard" element={<EventDashboard />} />
        <Route path="/events/add" element={<EventRegister />} />
        <Route path="/events/list" element={<EventManagement />} />
        <Route path="/events/past" element={<EventManagement />} />
        <Route path="/events/current" element={<EventManagement />} />
        <Route path="/events/future" element={<EventManagement />} />
        <Route path="/events/edit/:id" element={<EventManagement />} />
        <Route path="/events/delete/:id" element={<EventManagement />} />
        {/* Add other routes as needed */}
      </Routes>
    </Router>
  );
};

export default App;
