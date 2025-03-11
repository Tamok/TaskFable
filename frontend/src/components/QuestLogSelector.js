// frontend/src/components/QuestLogSelector.js
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import CONFIG from "../config";
import QuestLogButton from "./QuestLogButton";
import "./QuestLogSelector.css";

/**
 * QuestLogSelector Component
 *
 * Manages the dropdown list of Quest Logs.
 * - The main QuestLogButton (via onAccessQL) accesses the current Quest Log (dashboard view).
 * - The dropdown arrow toggles a panel listing all available Quest Logs and includes a creation area.
 *
 * Logs key actions for debugging.
 *
 * Props:
 * - currentUser: the logged-in user.
 * - currentQuestLog: the currently selected Quest Log.
 * - setCurrentQuestLog: function to update the current Quest Log.
 * - onAccessQL: function to navigate to the Quest Log view (e.g., setActiveTab("dashboard")).
 */
function QuestLogSelector({ currentUser, currentQuestLog, setCurrentQuestLog, onAccessQL }) {
  const [questLogs, setQuestLogs] = useState([]);
  const [newQLName, setNewQLName] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fetch quest logs for the current user.
  const fetchQuestLogs = useCallback(async () => {
    try {
      const response = await axios.get(
        `${CONFIG.BACKEND_URL}/questlogs?username=${currentUser.username}`
      );
      console.log("Fetched quest logs:", response.data);
      setQuestLogs(response.data);
      if (!currentQuestLog && response.data.length > 0) {
        setCurrentQuestLog(response.data[0]);
        console.log("Default Quest Log selected:", response.data[0]);
      }
    } catch (error) {
      console.error("Error fetching quest logs:", error);
    }
  }, [currentUser, currentQuestLog, setCurrentQuestLog]);

  useEffect(() => {
    fetchQuestLogs();
  }, [fetchQuestLogs]);

  // Handle creating a new Quest Log.
  const handleCreateQuestLog = async () => {
    if (!newQLName) {
      console.warn("No name entered for new Quest Log.");
      return;
    }
    try {
      const response = await axios.post(`${CONFIG.BACKEND_URL}/questlogs`, {
        name: newQLName,
        owner_username: currentUser.username
      });
      console.log("New Quest Log created:", response.data);
      setNewQLName("");
      fetchQuestLogs();
      const newQL = { id: response.data.quest_log_id, name: newQLName };
      setCurrentQuestLog(newQL);
      console.log("Switched to new Quest Log:", newQL);
      setDropdownOpen(false);
    } catch (error) {
      console.error("Error creating quest log:", error);
    }
  };

  return (
    <div className="questlog-selector-container">
      <QuestLogButton
        currentQuestLog={currentQuestLog}
        onAccessQL={onAccessQL}
        onToggleDropdown={() => setDropdownOpen(!dropdownOpen)}
      />
      {dropdownOpen && (
        <div className="questlog-dropdown">
          <ul>
            {questLogs.map(ql => (
              <li
                key={ql.id}
                onClick={() => {
                  setCurrentQuestLog(ql);
                  console.log("Switched to Quest Log via dropdown:", ql);
                  setDropdownOpen(false);
                }}
                title={`Switch to ${ql.name}`}
              >
                {ql.name} {ql.owner_username === currentUser.username ? "(Owner)" : ""}
              </li>
            ))}
          </ul>
          <div className="questlog-create">
            <input
              type="text"
              placeholder="New Quest Log Name"
              value={newQLName}
              onChange={(e) => setNewQLName(e.target.value)}
              title="Enter new Quest Log name"
            />
            <button onClick={handleCreateQuestLog} className="btn" title="Create new Quest Log">
              Create
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuestLogSelector;
