// frontend/src/Login.js
// ---------------------------------------------------------------------
// Login Component
// ---------------------------------------------------------------------
// Provides login/signup functionality with a "Keep me logged in" checkbox.
// The layout has been updated using Login.css to ensure proper alignment.
// ---------------------------------------------------------------------
import React, { useState } from "react";
import axios from "axios";
import CONFIG from "../config";
import "./Login.css";

function Login({ onLogin }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${CONFIG.BACKEND_URL}/users/login`, {
        identifier,
        password,
        email: email || null
      });
      onLogin(res.data.user, keepLoggedIn);
    } catch (error) {
      console.error("Error during login/signup", error);
      alert("Login/Signup failed. Please check your credentials or provide an email for signup.");
    }
  };

  return (
    <div className="login-container" title="Login or sign up for TaskFable">
      <h2>Login / Signup</h2>
      <form onSubmit={handleLogin} className="login-form">
        <input
          type="text"
          placeholder="Username or Email"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          title="Enter your username or email"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          title="Enter your password"
        />
        <input
          type="email"
          placeholder="(For signup only) Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          title="Enter your email for signup"
        />
        <div className="keep-logged-in">
          <input
            type="checkbox"
            checked={keepLoggedIn}
            onChange={(e) => setKeepLoggedIn(e.target.checked)}
            id="keepLoggedIn"
          />
          <label htmlFor="keepLoggedIn" title="Keep me logged in">Keep me logged in</label>
        </div>
        <button type="submit" className="login-btn" title="Login / Signup">
          Login / Signup
        </button>
      </form>
      <p title="Instructions">Note: To login, enter your username or email with your password. To sign up, please include your email.</p>
    </div>
  );
}

export default Login;
