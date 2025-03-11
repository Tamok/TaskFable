import React, { useEffect, useState } from 'react';
import axios from 'axios';
import CONFIG from '../config';
import { formatTimestamp } from '../utils/time';
import './ActivityLogPanel.css';

const ActivityLogPanel = ({ questLogId, user }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const timezone = user && user.timezone ? user.timezone : 'UTC+00:00';

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await axios.get(`${CONFIG.BACKEND_URL}/questlogs/${questLogId}/activities`);
        setActivities(res.data);
      } catch (err) {
        console.error("Error fetching activity logs:", err);
        setError('Failed to load activity logs.');
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, [questLogId]);

  if (loading) return <div>Loading activity logs...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="activity-log-panel">
      <ul>
        {activities.map(activity => (
          <li key={activity.id}>
            <strong>{activity.action}</strong> by {activity.username} at {formatTimestamp(activity.timestamp, timezone)}
            {activity.details && <span> – {activity.details}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActivityLogPanel;
