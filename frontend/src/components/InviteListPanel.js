// frontend/src/components/InviteListPanel.js
// ---------------------------------------------------------------------
// InviteListPanel Component
// ---------------------------------------------------------------------
// Displays a list of all invite links for the current Quest Log with their
// status, full invite link, and creation date. Invites are sorted by most
// recent first. Each entry includes a copy button; if revoked, the entry is
// rendered with strikethrough styling.
// The list auto-refreshes when a "boardAction" event is detected as well as
// every 30 seconds.
// ---------------------------------------------------------------------
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import CONFIG from '../config';
import './InviteListPanel.css';
import { formatTimestamp } from "../utils/time";

const InviteListPanel = ({ questLogId, user }) => {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInvites = useCallback(async () => {
    try {
      const res = await axios.get(`${CONFIG.BACKEND_URL}/questlogs/${questLogId}/invites`);
      setInvites(res.data);
      console.info(`Fetched ${res.data.length} invites for quest log ${questLogId}`);
    } catch (err) {
      console.error("Error fetching invites:", err);
      setError('Failed to load invites.');
    } finally {
      setLoading(false);
    }
  }, [questLogId]);

  // Auto-refresh on interval and when a "boardAction" event is dispatched.
  useEffect(() => {
    fetchInvites();
    const interval = setInterval(fetchInvites, 30000);
    const boardActionListener = () => fetchInvites();
    window.addEventListener("boardAction", boardActionListener);
    return () => {
      clearInterval(interval);
      window.removeEventListener("boardAction", boardActionListener);
    };
  }, [fetchInvites]);

  const revokeInvite = async (inviteId) => {
    try {
      await axios.delete(`${CONFIG.BACKEND_URL}/questlogs/${questLogId}/invites/${inviteId}?username=${user.username}`);
      console.info(`Invite ${inviteId} revoked by ${user.username}`);
      fetchInvites();
      window.dispatchEvent(new CustomEvent("boardAction"));
    } catch (err) {
      console.error("Error revoking invite:", err);
      alert("Failed to revoke invite.");
    }
  };
  

  const copyLink = (token) => {
    const fullLink = `${CONFIG.BACKEND_URL}/questlogs/invite/accept?token=${token}`;
    navigator.clipboard.writeText(fullLink);
    alert("Invite link copied to clipboard!");
  };

  if (loading) return <div className="invite-list-panel">Loading invites...</div>;
  if (error) return <div className="invite-list-panel error" title="Error loading invites">{error}</div>;

  return (
    <div className="invite-list-panel" title="Invite list auto-refreshes on board actions">
      <h3 title="List of generated invite links">Existing Invites</h3>
      {invites.length === 0 ? (
        <p>No invites generated yet.</p>
      ) : (
        <ul>
          {invites.map(invite => (
            <li key={invite.id} className={`invite-item ${invite.revoked ? 'revoked' : ''}`} title={`Invite created on ${new Date(invite.created_at).toLocaleString()}`}>
              <div className="invite-details">
                <span className="invite-link" title="Click to copy invite link" onClick={() => copyLink(invite.token)}>
                  {`${CONFIG.BACKEND_URL}/questlogs/invite/accept?token=${invite.token}`}
                </span>
                <span className="invite-created" title="Creation date">
                    {formatTimestamp(invite.created_at, user.timezone)}
                </span>
                <span className="invite-status" title="Current status">{invite.status}</span>
              </div>
              { !invite.revoked && invite.status !== 'Expired' && (
                <button 
                  className="revoke-btn" 
                  onClick={() => revokeInvite(invite.id)}
                  title="Revoke this invite link"
                >
                  Revoke
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default InviteListPanel;
