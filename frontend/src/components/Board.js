// frontend/src/components/Board.js
import React, { useState, useEffect } from "react";
import Column from "./Column";
import SortFilterBar from "./SortFilterBar";
import { DragDropContext } from "@hello-pangea/dnd";

const columns = ["To-Do", "Doing", "Waiting", "Done"];

function Board({ tasks, refreshTasks, user, isSpectator }) {
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filterText, setFilterText] = useState("");
  // manualOrder holds the custom order (by task id) for each column when manual mode is active.
  const [manualOrder, setManualOrder] = useState({});

  // Initialize or update manual order when tasks change (only in manual mode).
  useEffect(() => {
    if (sortField !== "") return; // only update in manual order mode
    setManualOrder((prevOrder) => {
      const newOrder = { ...prevOrder };
      columns.forEach((col) => {
        const colTasks = tasks.filter((t) => t.status === col);
        const existingOrder = newOrder[col] || [];
        // Retain ordering for tasks that still exist; append new tasks.
        const updatedOrder = [
          ...existingOrder.filter((id) => colTasks.some((t) => t.id === id)),
          ...colTasks.filter((t) => !existingOrder.includes(t.id)).map((t) => t.id)
        ];
        newOrder[col] = updatedOrder;
      });
      return newOrder;
    });
  }, [tasks, sortField]);

  // Helper to compute last modified timestamp.
  const getLastModified = (task) => {
    if (task.history && task.history.length > 0) {
      return task.history[task.history.length - 1].timestamp;
    }
    return task.created_at;
  };

  // Helper to get created_at timestamp.
  const getCreatedAt = (task) => {
    return task.created_at;
  };

  // Filter and order tasks per column.
  const getOrderedTasks = (colTasks, col) => {
    let filtered = colTasks.filter((task) => {
      const text = filterText.toLowerCase();
      return (
        task.title.toLowerCase().includes(text) ||
        task.owner_username.toLowerCase().includes(text) ||
        (task.description && task.description.toLowerCase().includes(text)) ||
        (task.comments && task.comments.some(comment => comment.content.toLowerCase().includes(text)))
      );
    });
    if (sortField !== "") {
      filtered.sort((a, b) => {
        let aValue, bValue;
        switch (sortField) {
          case "title":
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          case "owner":
            aValue = a.owner_username.toLowerCase();
            bValue = b.owner_username.toLowerCase();
            break;
          case "created_at":
            aValue = new Date(getCreatedAt(a)).getTime();
            bValue = new Date(getCreatedAt(b)).getTime();
            break;
          case "last_modified":
            aValue = new Date(getLastModified(a)).getTime();
            bValue = new Date(getLastModified(b)).getTime();
            break;
          default:
            aValue = 0;
            bValue = 0;
        }
        if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
      return filtered;
    } else {
      const order = manualOrder[col] || [];
      filtered.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
      return filtered;
    }
  };

  // Handle drag-and-drop events to update manual order.
  const onDragEnd = (result) => {
    if (isSpectator) return; // Spectators cannot reorder cards.
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId !== destination.droppableId) return; // only allow reordering within the same column
    const col = source.droppableId;
    const newOrder = Array.from(manualOrder[col] || []);
    const [removed] = newOrder.splice(source.index, 1);
    newOrder.splice(destination.index, 0, removed);
    setManualOrder((prev) => ({ ...prev, [col]: newOrder }));
    refreshTasks();
  };

  // Only show the filter bar if not in spectator mode.
  const showFilter = !isSpectator;

  return (
    <div>
      {showFilter && (
        <SortFilterBar 
          sortField={sortField}
          setSortField={setSortField}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          filterText={filterText}
          setFilterText={setFilterText}
        />
      )}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="board">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col);
            const orderedTasks = getOrderedTasks(colTasks, col);
            return (
              <Column 
                key={col} 
                title={col} 
                tasks={orderedTasks} 
                refreshTasks={refreshTasks} 
                user={user} 
                manualOrderMode={sortField === ""}
                isSpectator={isSpectator}
              />
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}

export default Board;
