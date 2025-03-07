// frontend/src/App.js
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Board from "./components/Board";
import Feed from "./components/Feed";
import CreateTaskForm from "./components/CreateTaskForm";
import SettingsPage from "./components/SettingsPage";
import LogsPage from "./components/LogsPage";
import ChangelogPage from "./components/ChangelogPage"; // New component for the changelog page
import Login from "./components/Login";
import Notifications from "./components/Notifications";
import CONFIG from "./config";
import "./styles/index.css";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [tasks, setTasks] = useState([]);
  const [stories, setStories] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  // Notifications management
  const addNotification = (message) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message }]);
  };
  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // If user has no timezone, fetch the server's timezone
  useEffect(() => {
    const initUserTimezone = async () => {
      if (user && !user.timezone) {
        try {
          const res = await axios.get(`${CONFIG.BACKEND_URL}/server/timezone`);
          const serverTz = res.data.server_timezone;
          const updatedUser = { ...user, timezone: serverTz };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUser(updatedUser);
        } catch (error) {
          console.error("Error fetching server timezone:", error);
        }
      }
    };
    initUserTimezone();
  }, [user]);

  // Wrap fetchTasks so it only changes when 'user' changes.
  const fetchTasks = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.get(
        `${CONFIG.BACKEND_URL}/tasks?viewer_username=${user.username}`
      );
      setTasks(res.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }, [user]);

  // Wrap fetchStories so it only changes when 'user' changes.
  const fetchStories = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.get(
        `${CONFIG.BACKEND_URL}/stories?viewer_username=${user.username}`
      );
      setStories(res.data);
    } catch (error) {
      console.error("Error fetching stories:", error);
    }
  }, [user]);

  // Combined effect: fetch immediately and set up polling when user or user's timezone changes.
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
  }, [user, user?.timezone, fetchTasks, fetchStories]);

  // Handle login and persist user.
  const handleUserLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  // Refresh user details and re-fetch tasks/stories.
  const refreshUser = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${CONFIG.BACKEND_URL}/users/${user.username}`);
      const updatedUser = res.data;
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      await fetchTasks();
      await fetchStories();
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  // Toggle dark mode on the body element based on user preference.
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
      <Notifications notifications={notifications} removeNotification={removeNotification} />
      <header className="app-header">
        <h1 className="header-title">
          TaskFable <span className="version">v{CONFIG.VERSION}</span>
        </h1>
        <p className="welcome-text">Welcome, {user.username}</p>
        <nav className="main-nav">
          <button
            title="Dashboard: View your tasks and story feed"
            onClick={() => setActiveTab("dashboard")}
            className="btn"
          >
            Dashboard
          </button>
          <button
            title="Settings: Update your account preferences"
            onClick={() => setActiveTab("settings")}
            className="btn"
          >
            Settings
          </button>
          <button
            title="Logs: View backend and frontend logs"
            onClick={() => setActiveTab("logs")}
            className="btn"
          >
            Logs
          </button>
          <button
            title="Changelog: Read the latest updates"
            onClick={() => setActiveTab("changelog")}
            className="btn"
          >
            Changelog
          </button>
        </nav>
      </header>

      {activeTab === "dashboard" && (
        <div className="dashboard">
          <div className="board-container">
            <CreateTaskForm
              refreshTasks={fetchTasks}
              currentUser={user}
              isDarkMode={user.dark_mode}
              addNotification={addNotification}
            />
            <Board tasks={tasks} refreshTasks={fetchTasks} user={user} />
          </div>
          <div className="feed-container">
            <Feed key={user.timezone} stories={stories} user={user} />
          </div>
        </div>
      )}
      {activeTab === "settings" && (
        <div className="page-container">
          <SettingsPage
            currentUser={user}
            refreshUser={refreshUser}
            addNotification={addNotification}
          />
        </div>
      )}
      {activeTab === "logs" && (
        <div className="page-container">
          <LogsPage />
        </div>
      )}
      {activeTab === "changelog" && (
        <div className="page-container">
          <ChangelogPage />
        </div>
      )}
    </div>
  );
}

export default App;
