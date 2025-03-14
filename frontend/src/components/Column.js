// frontend/src/components/Column.js
import React from "react";
import Card from "./Card";
import { Droppable, Draggable } from "@hello-pangea/dnd";

function Column({ title, tasks, refreshTasks, user, manualOrderMode, isSpectator }) {
  if (manualOrderMode) {
    return (
      <div className="column">
        <h2>{title}</h2>
        <Droppable droppableId={title} isDropDisabled={isSpectator}>
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {tasks.map((task, index) => (
                <Draggable
                  key={task.id}
                  draggableId={`task-${task.id}`}
                  index={index}
                  isDragDisabled={isSpectator}
                >
                  {(provided) => (
                    <div 
                      ref={provided.innerRef} 
                      {...provided.draggableProps} 
                      {...provided.dragHandleProps}
                    >
                      <Card 
                        task={task} 
                        refreshTasks={refreshTasks} 
                        user={user} 
                        isSpectator={isSpectator} 
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    );
  } else {
    return (
      <div className="column">
        <h2>{title}</h2>
        {tasks.map((task) => (
          <Card 
            key={task.id} 
            task={task} 
            refreshTasks={refreshTasks} 
            user={user} 
            isSpectator={isSpectator} 
          />
        ))}
      </div>
    );
  }
}

export default Column;
