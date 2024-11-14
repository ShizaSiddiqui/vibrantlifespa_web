import React, { useState } from 'react';

const SignUp = ({ setClientId }) => {
  const [formData, setFormData] = useState({
    email: '',
    dob: '',
    firstName: '',
    lastName: '',
    mobilePhone: '',
    pronoun: ''
  });
  
  const [message, setMessage] = useState('');
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { email, dob, firstName, lastName, mobilePhone, pronoun } = formData;
    
    const requestBody = {
      email,
      dob,
      externalId: email, // Automatically set externalId to email
      firstName,
      lastName,
      mobilePhone,
      pronoun
    };
    
    try {
      const response = await fetch('http://localhost:8000/createClient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      if (data.status === true) {
        setMessage('Sign-up successful!');
        const clientId = data.data.data.createClient.client.id; // Extract client ID
        setClientId(clientId); // Save the client ID in App.js
      } else {
        setMessage('Error: ' + data.message);
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  return (
    <div className="flex items-center justify-center  bg-blue-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="dob">Date of Birth</label>
            <input
              type="date"
              id="dob"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="mobilePhone">Mobile Phone</label>
            <input
              type="tel"
              id="mobilePhone"
              name="mobilePhone"
              value={formData.mobilePhone}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="pronoun">Pronoun</label>
            <select
              id="pronoun"
              name="pronoun"
              value={formData.pronoun}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="he/him">he/him</option>
              <option value="she/her">she/her</option>
              <option value="they/them">they/them</option>
              <option value="prefer not to answer">prefer not to answer</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Sign Up
          </button>
        </form>

        {message && (
          <div className="mt-4 text-center">
            <p className="text-gray-700">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignUp;
