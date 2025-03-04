// frontend/src/components/Notifications.js
import React, { useEffect, useState } from "react";

function Notification({ id, message, onRemove }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // After 2.5s, trigger fade-out
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 2500);
    // Remove after fade-out transition (0.5s)
    const removeTimer = setTimeout(() => {
      onRemove(id);
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [id, onRemove]);

  return (
    <div className={`notification ${fading ? "fade-out" : ""}`}>
      {message}
    </div>
  );
}

export default function Notifications({ notifications, removeNotification }) {
  return (
    <div className="notifications-container">
      {notifications.map((n) => (
        <Notification
          key={n.id}
          id={n.id}
          message={n.message}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );
}
