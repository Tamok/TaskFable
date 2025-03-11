// frontend/src/components/QuestLogButton.js
import React from "react";
import PropTypes from "prop-types";
import "./QuestLogButton.css";

/**
 * QuestLogButton Component
 *
 * Styled to match the height and style of the other dashboard buttons.
 * It is split into two clickable areas:
 * - The left area displays the current Quest Log's name and, when clicked, calls onAccessQL to access the board.
 * - The right area (dropdown arrow) toggles the dropdown list.
 *
 * Props:
 * - currentQuestLog: the currently selected Quest Log object.
 * - onAccessQL: function to call when the main button is clicked.
 * - onToggleDropdown: function to toggle the dropdown list.
 */
const QuestLogButton = ({ currentQuestLog, onAccessQL, onToggleDropdown }) => {
  return (
    <div className="questlog-button" onClick={onAccessQL} title="Access Quest Log">
      <span className="ql-name">
        {currentQuestLog ? currentQuestLog.name : "Select Board"}
      </span>
      <span
        className="ql-dropdown-arrow"
        onClick={(e) => {
          // Prevent triggering the main click event.
          e.stopPropagation();
          onToggleDropdown();
        }}
        title="Switch Board / Create Board"
      >
        ▾
      </span>
    </div>
  );
};

QuestLogButton.propTypes = {
  currentQuestLog: PropTypes.object,
  onAccessQL: PropTypes.func.isRequired,
  onToggleDropdown: PropTypes.func.isRequired,
};

export default QuestLogButton;
