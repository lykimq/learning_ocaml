import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // Ensure Navigate is imported
import Login from './components/auth/Login';
import UserRegistration from './components/users/UserRegistration';
import Home from './components/Home';
import Dashboard from './components/auth/Dashboard';

const App = () => {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Login */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/dashboard" element={<Dashboard />} />

        {/* Users */}
        <Route path="/users/register" element={<UserRegistration />} />

        {/* Add other routes as needed */}
      </Routes>
    </Router>
  );
};

export default App;
