import React, { useState } from "react";
import axios from "axios";
import CONFIG from "../config";
import { logFrontendEvent } from "../utils/logger";

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
      const confirmed = window.confirm("Ending your adventure will conclude your journey. Are you sure you want to finish?");
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
      });
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
      });
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
        new_content: editingCommentText,
        username: user.username
      });
      setEditingCommentId(null);
      setEditingCommentText("");
      refreshTasks();
      logFrontendEvent(`Comment ${commentId} edited by ${user.username}`);
    } catch (error) {
      console.error("Error editing comment:", error);
    }
  };

  // For private tasks, non-owners see "Solo Adventure" as title, but owner info is still shown.
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

  const filteredHistory = showHistory ? task.history : task.history.filter(h => h.status === "Created" || h.status === "Done");

  return (
    <div className={`card ${task.color}`} style={{ position: "relative" }}>
      <h3>
        {task.title}{" "}
        {task.is_private && <span title="Private Task" style={{ marginLeft: "5px" }}>🙈</span>}
        {task.locked && <span title="Locked Task" style={{ marginLeft: "5px" }}>🔒</span>}
        <br />
        <small>Owner: {task.owner_username}{task.co_owners && task.co_owners.length > 0 && ` | Co-owners: ${task.co_owners.join(", ")}`}</small>
      </h3>
      <div className="description" style={{ position: "relative", paddingRight: "30px", wordWrap: "break-word" }}>
        {isEditingDescription ? (
          <>
            <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
            <button onClick={handleEditDescription}>Save</button>
            <button onClick={() => setIsEditingDescription(false)}>Cancel</button>
          </>
        ) : (
          <>
            <p>{task.description}</p>
            {isOwner && task.status !== "Done" && (
              <button className="edit-button" onClick={() => setIsEditingDescription(true)} title="Edit description">✎</button>
            )}
          </>
        )}
      </div>
      <div className="card-actions">
        {availableStatuses.map((status) => (
          <button key={status} onClick={() => canAct && handleStatusChange(status)} disabled={!canAct}>
            {status}
          </button>
        ))}
      </div>
      <div className="comments">
        <h4>Comments</h4>
        {task.comments && task.comments.map((comment) => (
          <div key={comment.id} className="comment" style={{ display: "flex", alignItems: "center" }}>
            {comment.owner_username === user.username && (
              <button className="edit-button" onClick={() => { setEditingCommentId(comment.id); setEditingCommentText(comment.content); }} title="Edit comment">✎</button>
            )}
            <strong style={{ marginRight: "5px" }}>{comment.owner_username}:</strong>
            {editingCommentId === comment.id ? (
              <>
                <input type="text" value={editingCommentText} onChange={(e) => setEditingCommentText(e.target.value)} />
                <button onClick={() => handleEditComment(comment.id)}>Save</button>
                <button onClick={() => setEditingCommentId(null)}>Cancel</button>
              </>
            ) : (
              <span>{comment.content}</span>
            )}
          </div>
        ))}
        <input type="text" placeholder="Add a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} />
        <button onClick={handleAddComment}>Add Comment</button>
      </div>
      <div className="history">
        <h4>
          History
          <button onClick={() => setShowHistory(!showHistory)} style={{ marginLeft: "5px", fontSize: "0.8em", cursor: "pointer" }} title="Toggle full history">
            {showHistory ? "−" : "+"}
          </button>
        </h4>
        {filteredHistory.map((entry, idx) => (
          <div key={idx} className="history-entry">
            <span>{entry.status} at {new Date(entry.timestamp).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Card;
