// frontend/src/components/InviteChoicePage.js
// ---------------------------------------------------------------------
// InviteChoicePage Component
// ---------------------------------------------------------------------
// This component is rendered when an "invite_token" query parameter is
// detected. It fetches invite details (board name, owner, etc.) from the
// backend and then displays a page prompting the user to either join or
// spectate the board.
// ---------------------------------------------------------------------
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatTimestamp } from "../utils/time";
import CONFIG from '../config';
import "./InviteChoicePage.css";

const InviteChoicePage = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [inviteDetails, setInviteDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Parse invite_token from query parameters.
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("invite_token");

  useEffect(() => {
    if (token) {
      axios
        .get(`${CONFIG.BACKEND_URL}/questlogs/invite/details?token=${token}`)
        .then((res) => {
          setInviteDetails(res.data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.response?.data?.detail || "Failed to fetch invite details.");
          setLoading(false);
        });
    } else {
      setError("No invite token provided.");
      setLoading(false);
    }
  }, [token]);

  const handleAccept = (action) => {
    axios
      .post(`${CONFIG.BACKEND_URL}/questlogs/invite/accept`, {
        token: token,
        username: user.username,
        action: action
      })
      .then((res) => {
        // Redirect to the board page using the quest_log_id from the response.
        navigate(`/board/${res.data.quest_log_id}`);
      })
      .catch((err) => {
        setError(err.response?.data?.detail || "Failed to accept invite.");
      });
  };

  if (loading) return <div className="invite-choice-page">Loading invite details...</div>;
  if (error) return <div className="invite-choice-page error">Error: {error}</div>;

  return (
    <div className="invite-choice-page" title="Invite Details">
      <h2>You’ve been invited!</h2>
      <p>
        Board: <strong>{inviteDetails.quest_log_name}</strong>
      </p>
      <p>
        Owner: <strong>{inviteDetails.owner_username}</strong>
      </p>
      {inviteDetails.expires_at && (
        <p>
          Expires at: {formatTimestamp(inviteDetails.expires_at, user.timezone)}
        </p>
      )}
      <p>Please choose how you'd like to join:</p>
      <div className="invite-actions">
        <button onClick={() => handleAccept("join")} title="Join the board">
          Join Board
        </button>
        <button onClick={() => handleAccept("spectate")} title="Spectate the board">
          Spectate Board
        </button>
      </div>
    </div>
  );
};

export default InviteChoicePage;
