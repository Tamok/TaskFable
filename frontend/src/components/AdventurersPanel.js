// frontend/src/components/AdventurersPanel.js
// ---------------------------------------------------------------------
// AdventurersPanel Component
// ---------------------------------------------------------------------
// Displays a list of board participants (adventurers). The board owner is
// marked with a crown icon. The component refreshes when a "boardAction"
// event is dispatched, as well as on mount.
// ---------------------------------------------------------------------
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import CONFIG from '../config';
import './AdventurersPanel.css';

const AdventurersPanel = ({ questLogId }) => {
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
  
    const fetchParticipants = useCallback(async () => {
      try {
        const res = await axios.get(`${CONFIG.BACKEND_URL}/questlogs/${questLogId}/participants`);
        setParticipants(res.data);
        console.info(`Fetched ${res.data.length} participants for quest log ${questLogId}`);
      } catch (err) {
        console.error("Error fetching participants:", err);
        setError('Failed to load participants.');
      } finally {
        setLoading(false);
      }
    }, [questLogId]);
  
    useEffect(() => {
      fetchParticipants();
      const interval = setInterval(fetchParticipants, 30000);
      const boardActionListener = () => fetchParticipants();
      window.addEventListener("boardAction", boardActionListener);
      return () => {
        clearInterval(interval);
        window.removeEventListener("boardAction", boardActionListener);
      };
    }, [fetchParticipants]);  

  if (loading) return <div className="adventurers-panel">Loading adventurers...</div>;
  if (error) return <div className="adventurers-panel error" title="Error loading adventurers">{error}</div>;

  return (
    <div className="adventurers-panel" title="List of board participants">
      <ul>
        {participants.map(p => (
          <li key={p.user_id} title={`Joined at ${new Date(p.joined_at).toLocaleString()}`}>
            {p.role === 'member' && <span className="crown" title="Board Owner">👑</span>}
            {p.username}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdventurersPanel;
