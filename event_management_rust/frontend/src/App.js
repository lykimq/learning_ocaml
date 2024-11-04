import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import UserRegistration from './UserRegistration';
import Home from './Home';
import Login from './Login';

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register-user" element={<UserRegistration />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;