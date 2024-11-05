import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // Ensure Navigate is imported
import Login from './Login';
import UserRegistration from './UserRegistration';
import Home from './Home';


const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<UserRegistration />} />
        {/* Add other routes as needed */}
      </Routes>
    </Router>
  );
};

export default App;
