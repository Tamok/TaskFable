// frontend/src/components/SettingsPage.js
import React, { useState } from "react";
import axios from "axios";
import CONFIG from "../config";
import { logFrontendEvent } from "../utils/logger";
import Select from "react-select";

/**
 * Custom react-select styles for the timezone dropdown.
 * Ensures one-line height, auto width (to match longest option),
 * and dark mode colors that match the co-owner picklist.
 */
const createSelectStyles = (isDarkMode) => ({
  control: (provided) => ({
    ...provided,
    minHeight: "35px",
    maxHeight: "35px",
    borderRadius: "4px",
    padding: "0 5px",
    fontSize: "0.9em",
    borderColor: isDarkMode ? "#555" : "#ccc",
    backgroundColor: isDarkMode ? "#333" : "#fff",
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: isDarkMode ? "#333" : "#fff",
    border: isDarkMode ? "1px solid #555" : "1px solid #ccc",
    fontSize: "0.9em",
  }),
  menuList: (provided) => ({
    ...provided,
    backgroundColor: isDarkMode ? "#333" : "#fff",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: isDarkMode ? "#aaa" : "#666",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: isDarkMode ? "#eee" : "#333",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? (isDarkMode ? "#666" : "#2684FF")
      : state.isFocused
        ? (isDarkMode ? "#555" : "#eee")
        : (isDarkMode ? "#333" : "#fff"),
    color: isDarkMode ? "#fff" : "#000",
  }),
});

function SettingsPage({ currentUser, refreshUser, addNotification }) {
  const initialTimezone =
    CONFIG.TIMEZONES.find((tz) => tz.value === currentUser.timezone) ||
    { value: "UTC+00:00", label: "UTC+00:00 (Greenwich Mean Time)" };

  const [skipConfirmBegin, setSkipConfirmBegin] = useState(currentUser.skip_confirm_begin);
  const [skipConfirmEnd, setSkipConfirmEnd] = useState(currentUser.skip_confirm_end);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [showTooltips, setShowTooltips] = useState(currentUser.show_tooltips);
  const [darkMode, setDarkMode] = useState(currentUser.dark_mode);
  const [devCollapsed, setDevCollapsed] = useState(true);

  const handleToggleBegin = async () => {
    try {
      const newSetting = !skipConfirmBegin;
      await axios.put(`${CONFIG.BACKEND_URL}/users/${currentUser.username}/settings`, {
        skip_confirm_begin: newSetting
      });
      setSkipConfirmBegin(newSetting);
      await refreshUser();
      addNotification("Settings Saved");
      logFrontendEvent(`User ${currentUser.username} changed skip_confirm_begin to ${newSetting}`);
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  const handleToggleEnd = async () => {
    try {
      const newSetting = !skipConfirmEnd;
      await axios.put(`${CONFIG.BACKEND_URL}/users/${currentUser.username}/settings`, {
        skip_confirm_end: newSetting
      });
      setSkipConfirmEnd(newSetting);
      await refreshUser();
      addNotification("Settings Saved");
      logFrontendEvent(`User ${currentUser.username} changed skip_confirm_end to ${newSetting}`);
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  const handleTimezoneChange = async (selectedOption) => {
    try {
      await axios.put(`${CONFIG.BACKEND_URL}/users/${currentUser.username}/settings`, {
        timezone: selectedOption.value
      });
      setTimezone(selectedOption);
      await refreshUser();
      addNotification("Settings Saved");
      logFrontendEvent(`User ${currentUser.username} changed timezone to ${selectedOption.value}`);
    } catch (error) {
      console.error("Error updating timezone:", error);
    }
  };

  const handleToggleTooltips = async () => {
    try {
      const newSetting = !showTooltips;
      await axios.put(`${CONFIG.BACKEND_URL}/users/${currentUser.username}/settings`, {
        show_tooltips: newSetting
      });
      setShowTooltips(newSetting);
      await refreshUser();
      addNotification("Settings Saved");
      logFrontendEvent(`User ${currentUser.username} changed show_tooltips to ${newSetting}`);
    } catch (error) {
      console.error("Error updating tooltips setting:", error);
    }
  };

  const handleToggleDarkMode = async () => {
    try {
      const newSetting = !darkMode;
      await axios.put(`${CONFIG.BACKEND_URL}/users/${currentUser.username}/settings`, {
        dark_mode: newSetting
      });
      setDarkMode(newSetting);
      await refreshUser();
      addNotification("Settings Saved");
      logFrontendEvent(`User ${currentUser.username} changed dark_mode to ${newSetting}`);
    } catch (error) {
      console.error("Error updating dark mode:", error);
    }
  };

  const handlePurgeTasks = async () => {
    if (!window.confirm("Are you sure you want to purge all tasks? This cannot be undone.")) return;
    try {
      await axios.post(`${CONFIG.BACKEND_URL}/tasks/dev/purge`);
      await refreshUser();
      addNotification("Settings Saved");
      logFrontendEvent(`User ${currentUser.username} purged all tasks`);
    } catch (error) {
      console.error("Error purging tasks:", error);
    }
  };

  const handleDeleteTodo = async () => {
    if (!window.confirm("Are you sure you want to delete all To-Do tasks?")) return;
    try {
      await axios.post(`${CONFIG.BACKEND_URL}/tasks/dev/delete_todo`);
      await refreshUser();
      addNotification("Settings Saved");
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
        <label title="Select your timezone.">Timezone:</label>
        <div className="timezone-picker">
          <Select
            value={timezone}
            onChange={handleTimezoneChange}
            options={CONFIG.TIMEZONES}
            styles={createSelectStyles(darkMode)}
            isSearchable={false}
            menuPlacement="auto"
          />
        </div>
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
            <button onClick={handlePurgeTasks} className="btn">Purge All Tasks</button>
            <button onClick={handleDeleteTodo} className="btn">Delete All To-Do Tasks</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SettingsPage;
