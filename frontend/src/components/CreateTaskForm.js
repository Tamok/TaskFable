import React, { useState, useEffect } from "react";
import axios from "axios";
import CONFIG from "../config";
import { logFrontendEvent } from "../utils/logger";

function CreateTaskForm({ refreshTasks, currentUser }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("blue");
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedCoOwners, setSelectedCoOwners] = useState([]);
  const [allUsernames, setAllUsernames] = useState([]);

  useEffect(() => {
    axios.get(`${CONFIG.BACKEND_URL}/users/all`)
      .then(res => {
        const others = res.data.filter(u => u !== currentUser.username);
        setAllUsernames(others);
      })
      .catch(err => console.error("Error fetching usernames:", err));
  }, [currentUser]);

  const handleCheckboxChange = (username) => {
    if (selectedCoOwners.includes(username)) {
      setSelectedCoOwners(selectedCoOwners.filter(u => u !== username));
    } else {
      setSelectedCoOwners([...selectedCoOwners, username]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const coOwnersStr = selectedCoOwners.join(",");
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
    <div className="create-task-form">
      <h2>Create a New Task</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input type="text" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <select value={color} onChange={(e) => setColor(e.target.value)}>
          <option value="blue">Blue</option>
          <option value="green">Green</option>
          <option value="red">Red</option>
          <option value="yellow">Yellow</option>
        </select>
        <label>
          <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
          Private Task
        </label>
        <div className="co-owner-picklist">
          <h4>Select Co-Owners:</h4>
          {allUsernames.map((uname, index) => (
            <label key={index} style={{ marginRight: "10px" }}>
              <input
                type="checkbox"
                value={uname}
                checked={selectedCoOwners.includes(uname)}
                onChange={() => handleCheckboxChange(uname)}
              />
              {uname}
            </label>
          ))}
        </div>
        <button type="submit">Add Task</button>
      </form>
    </div>
  );
}

export default CreateTaskForm;
