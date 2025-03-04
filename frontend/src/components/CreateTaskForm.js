// frontend/src/components/CreateTaskForm.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import CONFIG from "../config";
import { logFrontendEvent } from "../utils/logger";
import Select from "react-select";

function CreateTaskForm({ refreshTasks, currentUser, isDarkMode, addNotification }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("blue");
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedCoOwners, setSelectedCoOwners] = useState([]);
  const [allUsernames, setAllUsernames] = useState([]);

  useEffect(() => {
    axios.get(`${CONFIG.BACKEND_URL}/users/list`)
      .then((res) => {
        const others = res.data.filter((u) => u !== currentUser.username);
        setAllUsernames(others);
      })
      .catch((err) => console.error("Error fetching usernames:", err));
  }, [currentUser]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const coOwnersStr = selectedCoOwners.map((option) => option.value).join(",");
      const taskData = {
        title,
        description,
        color,
        is_private: isPrivate,
        owner_username: currentUser.username,
        co_owners: coOwnersStr
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
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="create-task-input create-task-description"
        />
        <select
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="create-task-select"
        >
          <option value="blue">Blue</option>
          <option value="green">Green</option>
          <option value="red">Red</option>
          <option value="yellow">Yellow</option>
        </select>
        <div className="create-task-checkbox">
          <label>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />{" "}
            Private Task
          </label>
        </div>
        <div className="co-owner-picklist">
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
        <button type="submit" className="btn">Add Task</button>
      </form>
    </div>
  );
}

export default CreateTaskForm;
