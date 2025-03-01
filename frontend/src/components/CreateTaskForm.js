import React, { useState, useEffect } from "react";
import axios from "axios";
import CONFIG from "../config";
import { logFrontendEvent } from "../utils/logger";
import Select from "react-select";

function CreateTaskForm({ refreshTasks, currentUser }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("blue");
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedCoOwners, setSelectedCoOwners] = useState([]);
  const [allUsernames, setAllUsernames] = useState([]);

  useEffect(() => {
    axios.get(`${CONFIG.BACKEND_URL}/users/list`)
      .then(res => {
        const others = res.data.filter(u => u !== currentUser.username);
        setAllUsernames(others);
      })
      .catch(err => console.error("Error fetching usernames:", err));
  }, [currentUser]);

  // Prepare options for react-select
  const options = allUsernames.map(username => ({
    value: username,
    label: username,
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const coOwnersStr = selectedCoOwners.map(option => option.value).join(",");
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
    } catch (error) {
      console.error("Error creating task:", error);
      alert(error.response?.data?.detail || "Error creating task");
    }
  };

  return (
    <div 
      className="create-task-form" 
      style={{
        padding: "10px",
        background: "#f7f7f7",
        borderRadius: "5px",
        marginBottom: "20px"
      }}
    >
      <h2 style={{ margin: "0 0 10px 0" }}>Create a New Task</h2>
      <form 
        onSubmit={handleSubmit} 
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px"
        }}
      >
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{
            flex: "1 1 150px",
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc"
          }}
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{
            flex: "2 1 250px",
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc"
          }}
        />
        <select
          value={color}
          onChange={(e) => setColor(e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc"
          }}
        >
          <option value="blue">Blue</option>
          <option value="green">Green</option>
          <option value="red">Red</option>
          <option value="yellow">Yellow</option>
        </select>
        <div style={{ display: "flex", alignItems: "center" }}>
          <label style={{ marginRight: "5px" }}>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />{" "}
            Private Task
          </label>
        </div>
        <div style={{ flex: "1 1 200px" }}>
          <Select
            isMulti
            name="coOwners"
            options={options}
            value={selectedCoOwners}
            onChange={setSelectedCoOwners}
            placeholder="Select Co-Owners..."
            styles={{
              control: (provided, state) => ({
                ...provided,
                minHeight: "38px",
                borderRadius: "4px",
                borderColor: state.isFocused ? "#2684FF" : provided.borderColor,
                boxShadow: state.isFocused ? "0 0 0 1px #2684FF" : provided.boxShadow,
              }),
              multiValue: (provided) => ({
                ...provided,
                backgroundColor: "#e0e0e0",
              }),
              multiValueLabel: (provided) => ({
                ...provided,
                color: "#333",
              }),
              multiValueRemove: (provided) => ({
                ...provided,
                color: "#333",
                ":hover": {
                  backgroundColor: "#ccc",
                  color: "#222",
                },
              }),
            }}
          />
        </div>
        <button 
          type="submit" 
          style={{
            padding: "8px 16px",
            borderRadius: "4px",
            background: "#2684FF",
            color: "#fff",
            border: "none",
            cursor: "pointer"
          }}
        >
          Add Task
        </button>
      </form>
    </div>
  );
}

export default CreateTaskForm;
