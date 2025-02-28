import React, { useState } from "react";
import axios from "axios";
import CONFIG from "../config";

function Login({ onLogin }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState(""); // Optional: needed only for signup

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${CONFIG.BACKEND_URL}/users/login`, {
        identifier,
        password,
        email: email || null
      });
      onLogin(res.data.user);
    } catch (error) {
      console.error("Error during login/signup", error);
      alert("Login/Signup failed. If you're signing in, enter your identifier and password. For signup, please also provide an email.");
    }
  };

  return (
    <div className="login">
      <h2>Login / Signup</h2>
      <form onSubmit={handleLogin}>
        <input type="text" placeholder="Username or Email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <input type="email" placeholder="(For signup only) Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="submit">Login / Signup</button>
      </form>
      <p>Note: To login, enter your username or email with your password. To sign up, please include your email.</p>
    </div>
  );
}

export default Login;
