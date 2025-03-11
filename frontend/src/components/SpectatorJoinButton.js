// frontend/src/components/SpectatorJoinButton.js
// ---------------------------------------------------------------------
// SpectatorJoinButton Component
// ---------------------------------------------------------------------
// Displays a "Join Board" button for users who are currently spectators.
// When clicked, it calls the backend to upgrade the membership from
// spectator to member and triggers a refresh of board data.
// ---------------------------------------------------------------------
import React from "react";
import axios from "axios";
import CONFIG from "../config";
import "./SpectatorJoinButton.css";

const SpectatorJoinButton = ({ questLogId, user, onUpgrade }) => {
  const handleJoin = async () => {
    try {
      const res = await axios.post(`${CONFIG.BACKEND_URL}/questlogs/${questLogId}/upgrade?username=${user.username}`);
      if (res.status === 200) {
        alert("You are now a member of this board!");
        if (onUpgrade) onUpgrade();
      }
    } catch (err) {
      console.error("Error upgrading membership:", err);
      alert("Failed to upgrade membership.");
    }
  };

  return (
    <div className="spectator-join">
      <button className="join-btn" onClick={handleJoin} title="Join the board to interact">
        Join Board
      </button>
    </div>
  );
};

export default SpectatorJoinButton;
