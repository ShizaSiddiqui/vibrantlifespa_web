import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import SignUp from './components/Signup.js';
import SignIn from './components/Signin.js';

import './App.css';

import BookingDisplayMain from './components/BookingDisplay.js';


function App() {
  const [clientId, setClientId] = useState(''); // To store the client ID

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<SignUp setClientId={setClientId} />} /> 
        <Route path="/booking" element={<BookingDisplayMain/>} /> 
        <Route path="/signin" element={<SignIn setClientId={setClientId} />} /> 

        
      </Routes>
    </Router>
  );
}

export default App;
