import React, { useState } from 'react';
import './App.css';

function App() {
  const [registerMessage, setRegisterMessage] = useState('');
  const [loginMessage, setLoginMessage] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    if (!validateEmail(email)) {
      setRegisterMessage('Invalid email format.');
      return;
    }

    if (!validatePassword(password)) {
      setRegisterMessage('Password does not meet criteria.');
      return;
    }

    const response = await fetch('http://localhost:5000/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.text();
    setRegisterMessage(result);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    const response = await fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.text();
    setLoginMessage(result);
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(password);
  };

  return (
    <div className="container">
      <div className="form-container">
        <h1>Welcome to the mental health app</h1>
        <p id="info">
          Email must be in the format someone@example.com. <br />
          Password must be at least 8 characters long and include an upper case letter, a lower case letter, a number, and a special character.
        </p>
        <form id="registrationForm" onSubmit={handleRegister}>
          <h2>Register</h2>
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" required />
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" name="password" required />
          <button type="submit">Register</button>
          <p id="registerMessage">{registerMessage}</p>
        </form>
        <form id="loginForm" onSubmit={handleLogin}>
          <h2>Login</h2>
          <label htmlFor="loginEmail">Email:</label>
          <input type="email" id="loginEmail" name="email" required />
          <label htmlFor="loginPassword">Password:</label>
          <input type="password" id="loginPassword" name="password" required />
          <button type="submit">Login</button>
          <p id="loginMessage">{loginMessage}</p>
        </form>
      </div>
    </div>
  );
}

export default App;
