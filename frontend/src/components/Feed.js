import React from "react";

function Feed({ stories }) {
  return (
    <div className="feed">
      <h2>Task Stories Feed</h2>
      {stories.map((story) => (
        <div key={story.id} className="story">
          <div className="story-content">
            {story.story_text.split("\n").map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
          <div className="story-footer">
            <span style={{ color: "inherit" }}>XP: {story.xp}</span> | <span style={{ color: "inherit" }}>Currency: {story.currency}</span>
            <br />
            <small>{new Date(story.created_at).toLocaleString()}</small>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Feed;
