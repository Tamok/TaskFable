// frontend/src/components/SettingsPage.js
import React, { useState } from "react";
import axios from "axios";
import CONFIG from "../config";
import { logFrontendEvent } from "../utils/logger";
import moment from "moment-timezone";

// Get complete list of IANA timezones using moment-timezone
const TIMEZONES = moment.tz.names();

function SettingsPage({ currentUser, refreshUser }) {
  const [skipConfirmBegin, setSkipConfirmBegin] = useState(currentUser.skip_confirm_begin);
  const [skipConfirmEnd, setSkipConfirmEnd] = useState(currentUser.skip_confirm_end);
  const [timezone, setTimezone] = useState(currentUser.timezone);
  const [showTooltips, setShowTooltips] = useState(currentUser.show_tooltips);
  const [darkMode, setDarkMode] = useState(currentUser.dark_mode);
  const [devCollapsed, setDevCollapsed] = useState(true);

  // Toggle "begin adventure" confirmation setting
  const handleToggleBegin = async () => {
    try {
      const newSetting = !skipConfirmBegin;
      await axios.put(`${CONFIG.BACKEND_URL}/users/${currentUser.username}/settings`, {
        skip_confirm_begin: newSetting
      });
      setSkipConfirmBegin(newSetting);
      refreshUser();
      logFrontendEvent(`User ${currentUser.username} changed skip_confirm_begin to ${newSetting}`);
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  // Toggle "end adventure" confirmation setting
  const handleToggleEnd = async () => {
    try {
      const newSetting = !skipConfirmEnd;
      await axios.put(`${CONFIG.BACKEND_URL}/users/${currentUser.username}/settings`, {
        skip_confirm_end: newSetting
      });
      setSkipConfirmEnd(newSetting);
      refreshUser();
      logFrontendEvent(`User ${currentUser.username} changed skip_confirm_end to ${newSetting}`);
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  // Handle timezone change
  const handleTimezoneChange = async (e) => {
    const newTimezone = e.target.value;
    try {
      await axios.put(`${CONFIG.BACKEND_URL}/users/${currentUser.username}/settings`, {
        timezone: newTimezone
      });
      setTimezone(newTimezone);
      refreshUser();
      logFrontendEvent(`User ${currentUser.username} changed timezone to ${newTimezone}`);
    } catch (error) {
      console.error("Error updating timezone:", error);
    }
  };

  // Toggle tooltips setting
  const handleToggleTooltips = async () => {
    try {
      const newSetting = !showTooltips;
      await axios.put(`${CONFIG.BACKEND_URL}/users/${currentUser.username}/settings`, {
        show_tooltips: newSetting
      });
      setShowTooltips(newSetting);
      refreshUser();
      logFrontendEvent(`User ${currentUser.username} changed show_tooltips to ${newSetting}`);
    } catch (error) {
      console.error("Error updating tooltips setting:", error);
    }
  };

  // Toggle dark mode setting
  const handleToggleDarkMode = async () => {
    try {
      const newSetting = !darkMode;
      await axios.put(`${CONFIG.BACKEND_URL}/users/${currentUser.username}/settings`, {
        dark_mode: newSetting
      });
      setDarkMode(newSetting);
      refreshUser();
      logFrontendEvent(`User ${currentUser.username} changed dark_mode to ${newSetting}`);
    } catch (error) {
      console.error("Error updating dark mode:", error);
    }
  };

  // Handle purging all tasks (developer section)
  const handlePurgeTasks = async () => {
    if (!window.confirm("Are you sure you want to purge all tasks? This cannot be undone.")) return;
    try {
      await axios.post(`${CONFIG.BACKEND_URL}/tasks/dev/purge`);
      refreshUser();
      logFrontendEvent(`User ${currentUser.username} purged all tasks`);
    } catch (error) {
      console.error("Error purging tasks:", error);
    }
  };

  // Handle deletion of all To-Do tasks (developer section)
  const handleDeleteTodo = async () => {
    if (!window.confirm("Are you sure you want to delete all To-Do tasks?")) return;
    try {
      await axios.post(`${CONFIG.BACKEND_URL}/tasks/dev/delete_todo`);
      refreshUser();
      logFrontendEvent(`User ${currentUser.username} deleted all To-Do tasks`);
    } catch (error) {
      console.error("Error deleting To-Do tasks:", error);
    }
  };

  return (
    <div className="settings">
      <h2>Settings</h2>
      <div>
        <label title="If unchecked, you'll be prompted when beginning an adventure.">
          <input type="checkbox" checked={skipConfirmBegin} onChange={handleToggleBegin} />
          Do not confirm Begin Adventure
        </label>
      </div>
      <div>
        <label title="If unchecked, you'll be prompted when ending an adventure.">
          <input type="checkbox" checked={skipConfirmEnd} onChange={handleToggleEnd} />
          Do not confirm End Adventure
        </label>
      </div>
      <div>
        <label title="Select your timezone.">
          Timezone:
          <select value={timezone} onChange={handleTimezoneChange}>
            {TIMEZONES.map((tz, idx) => (
              <option key={idx} value={tz}>{tz}</option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <label title="Toggle tooltips on or off.">
          <input type="checkbox" checked={showTooltips} onChange={handleToggleTooltips} />
          Show Tooltips
        </label>
      </div>
      <div>
        <label title="Toggle dark theme.">
          <input type="checkbox" checked={darkMode} onChange={handleToggleDarkMode} />
          Dark Mode
        </label>
      </div>
      <div className="dev-section">
        <h3 onClick={() => setDevCollapsed(!devCollapsed)} className="dev-header">
          {devCollapsed ? "▶" : "▼"} Dev Section
        </h3>
        {!devCollapsed && (
          <div className="dev-actions">
            <button onClick={handlePurgeTasks}>Purge All Tasks</button>
            <button onClick={handleDeleteTodo}>Delete All To-Do Tasks</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SettingsPage;
