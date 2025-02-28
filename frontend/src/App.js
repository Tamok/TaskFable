import React, { useState, useEffect } from "react";
import axios from "axios";
import Board from "./components/Board";
import Feed from "./components/Feed";
import CreateTaskForm from "./components/CreateTaskForm";
import SettingsPage from "./components/SettingsPage";
import LogsPage from "./components/LogsPage";
import Login from "./components/Login";
import CONFIG from "./config";
import "./styles.css";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard", "settings", "logs"
  const [tasks, setTasks] = useState([]);
  const [stories, setStories] = useState([]);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);

  const fetchTasks = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${CONFIG.BACKEND_URL}/tasks?viewer_username=${user.username}`);
      setTasks(res.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchStories = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${CONFIG.BACKEND_URL}/stories?viewer_username=${user.username}`);
      setStories(res.data);
    } catch (error) {
      console.error("Error fetching stories:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchStories();
      const interval = setInterval(() => {
        fetchTasks();
        fetchStories();
      }, CONFIG.POLL_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleUserLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const refreshUser = async () => {
    try {
      const res = await axios.get(`${CONFIG.BACKEND_URL}/users/${user.username}`);
      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  // Apply dark mode class based on user setting
  useEffect(() => {
    if (user && user.dark_mode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [user]);

  if (!user) {
    return <Login onLogin={handleUserLogin} />;
  }

  return (
    <div className="App">
      <header>
        <h1>Gamified Task Portal</h1>
        <p>Welcome, {user.username}</p>
        <nav>
          <button onClick={() => setActiveTab("dashboard")}>Dashboard</button>
          <button onClick={() => setActiveTab("settings")}>Settings</button>
          <button onClick={() => setActiveTab("logs")}>Logs</button>
        </nav>
      </header>
      {activeTab === "dashboard" && (
        <div className="dashboard">
          <div className="board-container">
            <CreateTaskForm refreshTasks={fetchTasks} currentUser={user} />
            <Board tasks={tasks} refreshTasks={fetchTasks} user={user} />
          </div>
          <div className="feed-container">
            <Feed stories={stories} />
          </div>
        </div>
      )}
      {activeTab === "settings" && (
        <SettingsPage currentUser={user} refreshUser={refreshUser} />
      )}
      {activeTab === "logs" && <LogsPage />}
    </div>
  );
}

export default App;
