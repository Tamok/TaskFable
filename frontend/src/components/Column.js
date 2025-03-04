// frontend/src/components/Column.js
import React from "react";
import Card from "./Card";

function Column({ title, tasks, refreshTasks, user }) {
  return (
    <div className="column">
      <h2>{title}</h2>
      {tasks.map((task) => (
        <Card key={task.id} task={task} refreshTasks={refreshTasks} user={user} />
      ))}
    </div>
  );
}

export default Column;
