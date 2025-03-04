// frontend/src/components/Card.js
import React, { useState } from "react";
import axios from "axios";
import CONFIG from "../config";
import { logFrontendEvent } from "../utils/logger";
import moment from "moment-timezone";
import { formatTimestamp } from "../utils/time";  

function Card({ task, refreshTasks, user }) {
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [newDescription, setNewDescription] = useState(task.description);
  const [commentText, setCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  let availableStatuses = [];
  if (task.status === "To-Do") {
    availableStatuses = ["Doing"];
  } else if (task.status === "Doing") {
    availableStatuses = ["Waiting", "Done"];
  } else if (task.status === "Waiting") {
    availableStatuses = ["Doing", "Done"];
  }

  const isOwner = task.owner_username === user.username;
  const canAct = !task.locked || isOwner;

  const handleStatusChange = async (newStatus) => {
    if (task.status === "To-Do" && newStatus === "Doing" && !user.skip_confirm_begin) {
      const confirmed = window.confirm("Once you begin your adventure, there is no turning back. Proceed?");
      if (!confirmed) return;
    }
    if (newStatus === "Done" && !user.skip_confirm_end) {
      const confirmed = window.confirm("Ending your adventure will conclude your journey. Are you sure?");
      if (!confirmed) return;
    }
    try {
      await axios.put(`${CONFIG.BACKEND_URL}/tasks/${task.id}/status`, {
        new_status: newStatus,
        username: user.username
      });
      refreshTasks();
      logFrontendEvent(`Task ${task.id} status changed to ${newStatus} by ${user.username}`);
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const handleAddComment = async () => {
    if (!commentText) return;
    try {
      await axios.post(`${CONFIG.BACKEND_URL}/tasks/comment`, {
        task_id: task.id,
        content: commentText,
        username: user.username
      }, { headers: { "Content-Type": "application/json" } });
      setCommentText("");
      refreshTasks();
      logFrontendEvent(`Comment added to task ${task.id} by ${user.username}`);
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleEditDescription = async () => {
    try {
      await axios.put(`${CONFIG.BACKEND_URL}/tasks/${task.id}/edit?username=${user.username}`, {
        description: newDescription
      }, { headers: { "Content-Type": "application/json" } });
      setIsEditingDescription(false);
      refreshTasks();
      logFrontendEvent(`Task ${task.id} description edited by ${user.username}`);
    } catch (error) {
      console.error("Error editing description:", error);
    }
  };

  const handleEditComment = async (commentId) => {
    try {
      await axios.put(`${CONFIG.BACKEND_URL}/tasks/comment/edit`, {
        comment_id: commentId,
        task_id: task.id,
        new_content: editingCommentText,
        username: user.username
      }, { headers: { "Content-Type": "application/json" } });
      setEditingCommentId(null);
      setEditingCommentText("");
      refreshTasks();
      logFrontendEvent(`Comment ${commentId} edited by ${user.username}`);
    } catch (error) {
      console.error("Error editing comment:", error);
    }
  };

  if (task.is_private && !isOwner) {
    return (
      <div className={`card ${task.color}`}>
        <h3>
          Solo Adventure <span title="Private Task" style={{ marginLeft: "5px" }}>🙈</span>
          <br />
          <small>Owner: {task.owner_username}</small>
        </h3>
      </div>
    );
  }

  const filteredHistory = showHistory
    ? task.history
    : task.history.filter(h => h.status === "Created" || h.status === "Done");

  return (
    <div className={`card ${task.color}`}>
      <h3>
        {task.title}{" "}
        {task.is_private && <span title="Private Task" style={{ marginLeft: "5px" }}>🙈</span>}
        {task.locked && <span title="Locked Task" style={{ marginLeft: "5px" }}>🔒</span>}
        <br />
        <small>
          Owner: {task.owner_username}
          {task.co_owners && task.co_owners.length > 0 && ` | Co-owners: ${task.co_owners.join(", ")}`}
        </small>
      </h3>
      <div className="description">
        {isEditingDescription ? (
          <>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="input-edit"
            />
            <button onClick={handleEditDescription} className="btn">Save</button>
            <button onClick={() => setIsEditingDescription(false)} className="btn">Cancel</button>
          </>
        ) : (
          <>
            <p>{task.description}</p>
            {isOwner && task.status !== "Done" && (
              <button
                className="edit-icon"
                onClick={() => setIsEditingDescription(true)}
                title="Edit description"
              >
                ✏
              </button>
            )}
          </>
        )}
      </div>
      <div className="card-actions">
        {availableStatuses.map((status) => (
          <button
            key={status}
            onClick={() => canAct && handleStatusChange(status)}
            disabled={!canAct}
            className="btn"
          >
            {status}
          </button>
        ))}
      </div>
      <div className="comments">
        <h4>Comments</h4>
        {task.comments && task.comments.map((comment) => (
          <div key={comment.id} className="comment">
            {comment.owner_username === user.username && (
              <button
                className="edit-icon"
                onClick={() => {
                  setEditingCommentId(comment.id);
                  setEditingCommentText(comment.content);
                }}
                title="Edit comment"
              >
                ✏
              </button>
            )}
            <strong className="comment-author">{comment.owner_username}:</strong>
            {editingCommentId === comment.id ? (
              <>
                <input
                  type="text"
                  value={editingCommentText}
                  onChange={(e) => setEditingCommentText(e.target.value)}
                  className="input-comment-edit"
                />
                <button onClick={() => handleEditComment(comment.id)} className="btn">Save</button>
                <button onClick={() => setEditingCommentId(null)} className="btn">Cancel</button>
              </>
            ) : (
              <span className="comment-text">{comment.content}</span>
            )}
          </div>
        ))}
        <input
          type="text"
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="input-comment"
        />
        <button onClick={handleAddComment} className="btn">Add Comment</button>
      </div>
      <div className="history">
        <h4>
          History
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="btn"
            title="Toggle full history"
          >
            {showHistory ? "−" : "+"}
          </button>
        </h4>
        {filteredHistory.map((entry, idx) => (
          <div key={idx} className="history-entry">
            <span>
              {entry.status} at {formatTimestamp(entry.timestamp, user.timezone)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Card;
