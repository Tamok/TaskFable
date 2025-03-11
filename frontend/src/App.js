// frontend/src/App.js
// ---------------------------------------------------------------------
// App Component
// ---------------------------------------------------------------------
// Manages user authentication, current Quest Log selection, and navigation
// between views. It preserves login state and, if an invite token is present,
// displays the InviteChoicePage. When the user is a spectator, interactive 
// features (e.g. task creation) are disabled.
// ---------------------------------------------------------------------
import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import BoardSubtabs from "./components/BoardSubtabs";
import Feed from "./components/Feed";
import CreateTaskForm from "./components/CreateTaskForm";
import SettingsPage from "./components/SettingsPage";
import LogsPage from "./components/LogsPage";
import ChangelogPage from "./components/ChangelogPage";
import Login from "./components/Login";
import InviteChoicePage from "./components/InviteChoicePage";
import SpectatorJoinButton from "./components/SpectatorJoinButton";
import Notifications from "./components/Notifications";
import QuestLogSelector from "./components/QuestLogSelector";
import TestReportDynamicPage from "./components/TestReportDynamicPage";
import CONFIG from "./config";
import "./styles/index.css";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const inviteToken = queryParams.get("invite_token");

  const [activeTab, setActiveTab] = useState("dashboard");
  const [tasks, setTasks] = useState([]);
  const [stories, setStories] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [currentQuestLog, setCurrentQuestLog] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  // Logout: clear stored user data.
  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    console.info("User logged out.");
    navigate("/");
  };

  // Refresh user info; auto‑logout if user not found.
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
      if (error.response && error.response.status === 404) {
        alert("Your account no longer exists. Logging out.");
        logout();
      } else {
        console.error("Error refreshing user:", error);
      }
    }
  };

  // Fetch tasks for the current Quest Log.
  const fetchTasks = useCallback(async () => {
    if (!user || !currentQuestLog) return;
    try {
      const res = await axios.get(
        `${CONFIG.BACKEND_URL}/tasks?viewer_username=${user.username}&quest_log_id=${currentQuestLog.id}`
      );
      setTasks(res.data);
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
    } catch (error) {
      console.error("Error fetching stories:", error);
    }
  }, [user, currentQuestLog]);

  // Fetch participants to determine user's role.
  const fetchParticipants = useCallback(async () => {
    if (!currentQuestLog) return;
    try {
      const res = await axios.get(`${CONFIG.BACKEND_URL}/questlogs/${currentQuestLog.id}/participants`);
      const participants = res.data;
      const me = participants.find(p => p.username === user.username);
      setCurrentUserRole(me ? me.role : null);
    } catch (error) {
      console.error("Error fetching participants:", error);
    }
  }, [currentQuestLog, user]);

  useEffect(() => {
    if (user && currentQuestLog) {
      fetchTasks();
      fetchStories();
      fetchParticipants();
      const interval = setInterval(() => {
        fetchTasks();
        fetchStories();
      }, CONFIG.POLL_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [user, currentQuestLog, fetchTasks, fetchStories, fetchParticipants]);

  // Notification management.
  const addNotification = (message) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message }]);
  };
  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Handle user login.
  const handleUserLogin = (userData, persist) => {
    setUser(userData);
    if (persist) {
      localStorage.setItem("user", JSON.stringify(userData));
    }
    console.info(`User ${userData.username} logged in.`);
    if (inviteToken) {
      navigate(`/?invite_token=${inviteToken}`);
    }
  };

  useEffect(() => {
    if (user && user.dark_mode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [user]);

  // Render login if not authenticated.
  if (!user) {
    return <Login onLogin={handleUserLogin} />;
  }

  // If invite token present, show InviteChoicePage.
  if (inviteToken) {
    return <InviteChoicePage user={user} inviteToken={inviteToken} />;
  }

  return (
    <div className="App">
      <Notifications notifications={notifications} removeNotification={removeNotification} />
      <header className="app-header">
        <h1 className="header-title">
          TaskFable <span className="version">v{CONFIG.VERSION}</span>
        </h1>
        <p className="welcome-text" title="Your username">{user.username}, welcome!</p>
        <nav className="main-nav">
          <QuestLogSelector
            currentUser={user}
            currentQuestLog={currentQuestLog}
            setCurrentQuestLog={setCurrentQuestLog}
            onAccessQL={() => setActiveTab("dashboard")}
          />
          <button title="Settings" onClick={() => setActiveTab("settings")} className="btn">
            Settings
          </button>
          <button title="Logs" onClick={() => setActiveTab("logs")} className="btn">
            Logs
          </button>
          <button title="Changelog" onClick={() => setActiveTab("changelog")} className="btn">
            Changelog
          </button>
          <button title="Test Report" onClick={() => setActiveTab("test_report")} className="btn">
            Test Report
          </button>
          <button title="Logout" onClick={logout} className="btn logout-btn">
            Logout
          </button>
        </nav>
      </header>

      {activeTab === "dashboard" && currentQuestLog && (
        <div className="dashboard">
          <div className="board-container">
            {currentUserRole === "spectator" ? (
              <div className="spectator-info">
                <p>
                  <strong>Spectator Mode:</strong> You are viewing this board in read‑only mode.
                  Spectators cannot create or modify tasks, comment, or generate invite links.
                  To actively participate, please click the button below to join the board.
                </p>
                <SpectatorJoinButton
                  questLogId={currentQuestLog.id}
                  user={user}
                  onUpgrade={fetchParticipants}
                />
              </div>
            ) : (
              <CreateTaskForm
                refreshTasks={fetchTasks}
                currentUser={user}
                currentQuestLog={currentQuestLog}
                isDarkMode={user.dark_mode}
                addNotification={addNotification}
              />
            )}
            <BoardSubtabs
              tasks={tasks}
              refreshTasks={fetchTasks}
              user={user}
              currentQuestLog={currentQuestLog}
              isSpectator={currentUserRole === "spectator"}
            />
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
