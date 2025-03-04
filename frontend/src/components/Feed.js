// frontend/src/components/Feed.js
import React from "react";
import moment from "moment-timezone";

function Feed({ stories, user }) {
  return (
    <div className="feed">
      <h2>Task Stories Feed</h2>
      {stories.map((story) => {
        const rawTimestamp = story.created_at;
        const formatted = moment.utc(rawTimestamp)
          .tz(user.timezone)
          .format("YYYY-MM-DD HH:mm:ss");
        console.log(
          `Story ${story.id}: raw timestamp=${rawTimestamp}, formatted with timezone ${user.timezone}=${formatted}`
        );
        return (
          <div key={story.id} className="story">
            <div className="story-content">
              {story.story_text.split("\n").map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
            <div className="story-footer">
              <span>XP: {story.xp}</span> | <span>Currency: {story.currency}</span>
              <br />
              <small>{formatted}</small>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Feed;
