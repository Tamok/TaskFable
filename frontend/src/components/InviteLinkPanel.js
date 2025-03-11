// frontend/src/components/InviteLinkPanel.js
// ---------------------------------------------------------------------
// InviteLinkPanel Component
// ---------------------------------------------------------------------
// Provides a form for generating a new invite link with options for a
// permanent invite or an expiry time. When an invite is generated, its token
// is shown (with a copy button). The form styling is updated for padding,
// alignment, and dark mode.
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CONFIG from '../config';
import './InviteLinkPanel.css';

const InviteLinkPanel = ({ questLogId, user }) => {
  const [expiresIn, setExpiresIn] = useState('');
  const [isPermanent, setIsPermanent] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isPermanent) {
      setExpiresIn('');
    }
  }, [isPermanent]);

  const generateInvite = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        expires_in_hours: isPermanent ? null : (expiresIn ? parseInt(expiresIn, 10) : null),
        is_permanent: isPermanent
      };
      const res = await axios.post(`${CONFIG.BACKEND_URL}/questlogs/${questLogId}/invite?username=${user.username}`, payload);
      const data = res.data;
      setInviteLink(data.token);
      setExpiresAt(data.expires_at);
      console.info(`Generated invite: ${data.token}`);
      // Dispatch event to notify other components.
      window.dispatchEvent(new CustomEvent("boardAction"));
    } catch (err) {
      console.error("Error generating invite:", err);
      setError(err.response?.data?.detail || 'Failed to generate invite link.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const fullLink = `${CONFIG.BACKEND_URL}/questlogs/invite/accept?token=${inviteLink}`;
    navigator.clipboard.writeText(fullLink);
    alert("Invite link copied to clipboard!");
  };

  return (
    <div className="invite-link-panel" title="Generate a new invite link">
      <h3>Generate Invite Link</h3>
      {error && <div className="error" title="Error">{error}</div>}
      {inviteLink ? (
        <div className="invite-display">
          <p>Your invite link:</p>
          <code title="Click to copy" onClick={handleCopy}>
            {`${CONFIG.BACKEND_URL}/questlogs/invite/accept?token=${inviteLink}`}
          </code>
          {expiresAt && <p title="Expiry date">Expires at: {new Date(expiresAt).toLocaleString()}</p>}
          <button onClick={handleCopy} className="copy-btn" title="Copy invite link">Copy Invite Link</button>
        </div>
      ) : (
        <div className="invite-form">
          <div className="form-group">
            <label title="Make invite permanent">
              <input type="checkbox" checked={isPermanent} onChange={(e) => setIsPermanent(e.target.checked)} />
              <span className="checkbox-text"> Permanent Invite Link</span>
            </label>
          </div>
          <div className="form-group">
            <label title="Enter expiry time (in hours) for temporary invite">
              Expires in hours:
              <input
                type="number"
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                disabled={isPermanent}
                className="expiry-input"
              />
            </label>
          </div>
          <button onClick={generateInvite} disabled={loading} className="generate-btn" title="Generate invite link">
            {loading ? 'Generating...' : 'Generate Invite Link'}
          </button>
        </div>
      )}
    </div>
  );
};

export default InviteLinkPanel;
