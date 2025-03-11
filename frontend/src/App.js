// frontend/src/App.js
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Board from "./components/Board";
import Feed from "./components/Feed";
import CreateTaskForm from "./components/CreateTaskForm";
import SettingsPage from "./components/SettingsPage";
import LogsPage from "./components/LogsPage";
import ChangelogPage from "./components/ChangelogPage";
import Login from "./components/Login";
import Notifications from "./components/Notifications";
import QuestLogSelector from "./components/QuestLogSelector";
import TestReportDynamicPage from "./components/TestReportDynamicPage";
import CONFIG from "./config";
import "./styles/index.css";

/**
 * App Component
 *
 * Manages user authentication, current Quest Log selection, and navigation between views.
 * Fetches tasks and stories for the selected Quest Log.
 */
function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [tasks, setTasks] = useState([]);
  const [stories, setStories] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [currentQuestLog, setCurrentQuestLog] = useState(null);

  // Fetch tasks for the current Quest Log.
  const fetchTasks = useCallback(async () => {
    if (!user || !currentQuestLog) return;
    try {
      const res = await axios.get(
        `${CONFIG.BACKEND_URL}/tasks?viewer_username=${user.username}&quest_log_id=${currentQuestLog.id}`
      );
      setTasks(res.data);
      console.log(`Fetched tasks for Quest Log ${currentQuestLog.id}:`, res.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }, [user, currentQuestLog]);

  // Fetch stories for the current Quest Log.
  const fetchStories = useCallback(async () => {
    if (!user || !currentQuestLog) return;
    try {
      const res = await axios.get(
        `${CONFIG.BACKEND_URL}/stories?viewer_username=${user.username}&quest_log_id=${currentQuestLog.id}`
      );
      setStories(res.data);
      console.log(`Fetched stories for Quest Log ${currentQuestLog.id}:`, res.data);
    } catch (error) {
      console.error("Error fetching stories:", error);
    }
  }, [user, currentQuestLog]);

  useEffect(() => {
    if (user && currentQuestLog) {
      fetchTasks();
      fetchStories();
      const interval = setInterval(() => {
        fetchTasks();
        fetchStories();
      }, CONFIG.POLL_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [user, currentQuestLog, fetchTasks, fetchStories]);

  // Notification management.
  const addNotification = (message) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message }]);
  };
  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Handle user login.
  const handleUserLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    console.log("User logged in:", userData);
  };

  // Refresh user details.
  const refreshUser = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${CONFIG.BACKEND_URL}/users/${user.username}`);
      const updatedUser = res.data;
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      await fetchTasks();
      await fetchStories();
      console.log("User refreshed:", updatedUser);
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

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
          <QuestLogSelector
            currentUser={user}
            currentQuestLog={currentQuestLog}
            setCurrentQuestLog={setCurrentQuestLog}
            onAccessQL={() => setActiveTab("dashboard")}
          />
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
          <button
            title="Test Report: View dynamic test report"
            onClick={() => setActiveTab("test_report")}
            className="btn"
          >
            Test Report
          </button>
        </nav>
      </header>

      {activeTab === "dashboard" && currentQuestLog && (
        <div className="dashboard">
          <div className="board-container">
            <CreateTaskForm
              refreshTasks={fetchTasks}
              currentUser={user}
              currentQuestLog={currentQuestLog}
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
          <SettingsPage currentUser={user} refreshUser={refreshUser} addNotification={addNotification} />
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
        {activeTab === "test_report" && (
          <div className="page-container">
            <TestReportDynamicPage />
          </div>
      )}
    </div>
  );
}

export default App;