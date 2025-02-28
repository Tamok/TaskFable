import React from "react";
import Column from "./Column";

const columns = ["To-Do", "Doing", "Waiting", "Done"];

function Board({ tasks, refreshTasks, user }) {
  return (
    <div className="board">
      {columns.map((col) => (
        <Column key={col} title={col} tasks={tasks.filter((t) => t.status === col)} refreshTasks={refreshTasks} user={user} />
      ))}
    </div>
  );
}

export default Board;
