// frontend/src/components/CreateTaskForm.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import CONFIG from "../config";
import { logFrontendEvent } from "../utils/logger";
import Select from "react-select";

/**
 * CreateTaskForm Component
 *
 * Provides a form for creating a new task.
 * The task will be associated with the currently selected Quest Log (board).
 * Co-owner selection uses react-select for a multi-select dropdown.
 */
function CreateTaskForm({ refreshTasks, currentUser, currentQuestLog, isDarkMode, addNotification }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("blue");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [selectedCoOwners, setSelectedCoOwners] = useState([]);
  const [allUsernames, setAllUsernames] = useState([]);

  useEffect(() => {
    if (currentQuestLog && currentUser) {
      axios.get(`${CONFIG.BACKEND_URL}/questlogs/${currentQuestLog.id}/participants`)
        .then((res) => {
          const options = res.data
            .filter(u => u.username !== currentUser.username)
            .map(u => ({ value: u.username, label: u.username }));
          setAllUsernames(options);
        })
        .catch((err) => console.error("Error fetching participants:", err));
    }
  }, [currentQuestLog, currentUser]);
  

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: "38px",
      borderRadius: "4px",
      borderColor: isDarkMode ? "#555" : "#ccc",
      backgroundColor: isDarkMode ? "#333" : "#fff",
      boxShadow: state.isFocused
        ? (isDarkMode ? "0 0 0 1px #999" : "0 0 0 1px #2684FF")
        : provided.boxShadow,
    }),
    input: (provided) => ({
      ...provided,
      color: isDarkMode ? "#eee" : "#000",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: isDarkMode ? "#aaa" : "#999",
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: isDarkMode ? "#333" : "#fff",
      color: isDarkMode ? "#eee" : "#000",
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
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: isDarkMode ? "#555" : "#e0e0e0",
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: isDarkMode ? "#ddd" : "#333",
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: isDarkMode ? "#ddd" : "#333",
      ":hover": {
        backgroundColor: isDarkMode ? "#777" : "#ccc",
        color: isDarkMode ? "#fff" : "#222",
      },
    }),
  };

  // Handle form submission to create a new task.
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const coOwnersStr = selectedCoOwners.map((option) => option.value).join(",");
      const taskData = {
        title,
        description,
        color,
        is_private: isPrivate,
        locked: isLocked,
        owner_username: currentUser.username,
        co_owners: coOwnersStr,
        quest_log_id: currentQuestLog.id  // Associate with the current Quest Log.
      };
      await axios.post(`${CONFIG.BACKEND_URL}/tasks`, taskData);
      setTitle("");
      setDescription("");
      setColor("blue");
      setIsPrivate(false);
      setSelectedCoOwners([]);
      refreshTasks();
      logFrontendEvent(`Task created: ${title} by ${currentUser.username}`);
      addNotification(`Task created: ${title}`);
    } catch (error) {
      console.error("Error creating task:", error);
      alert(error.response?.data?.detail || "Error creating task");
    }
  };

  return (
    <div className="create-task-form">
      <h2>Create a New Task</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="create-task-input create-task-title"
          title="Enter the task title"
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="create-task-input create-task-description"
          title="Enter a brief description of the task"
        />
        <select
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="create-task-select"
          title="Select a color for the task card"
        >
          <option value="blue">Blue</option>
          <option value="green">Green</option>
          <option value="red">Red</option>
          <option value="yellow">Yellow</option>
        </select>
        <div className="create-task-checkbox">
          <label title="Mark this task as private so only you can see the details">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />{" "}
            Private Task
          </label>
        </div>
        <div className="create-task-checkbox">
          <label title="Mark this task as locked so that only the owner can modify it">
            <input
              type="checkbox"
              checked={isLocked}
              onChange={(e) => setIsLocked(e.target.checked)}
            />{" "}
            Locked Task
          </label>
        </div>
        <div className="co-owner-picklist" title="Select one or more co-owners for collaborative tasks">
          <Select
            isMulti
            name="coOwners"
            options={allUsernames.map((uname) => ({ value: uname, label: uname }))}
            value={selectedCoOwners}
            onChange={setSelectedCoOwners}
            placeholder="Select Co-Owners..."
            styles={customSelectStyles}
          />
        </div>
        <button type="submit" className="btn" title="Click to create a new task">
          Add Task
        </button>
      </form>
    </div>
  );
}

export default CreateTaskForm;
