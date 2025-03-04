// frontend/src/hooks/useConfirmDone.js
import { useState, useEffect } from "react";

/**
 * Custom hook to prompt the user when moving a task to Done.
 * Remembers the user’s choice if requested.
 */
export function useConfirmDone() {
  const [confirmDone, setConfirmDone] = useState(true);
  const [rememberChoice, setRememberChoice] = useState(false);

  // Load stored choice from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("confirmDone");
    if (stored) {
      const parsed = JSON.parse(stored);
      setConfirmDone(parsed.confirmDone);
      setRememberChoice(parsed.rememberChoice);
    }
  }, []);

  // Persist choice changes to localStorage
  useEffect(() => {
    localStorage.setItem("confirmDone", JSON.stringify({ confirmDone, rememberChoice }));
  }, [confirmDone, rememberChoice]);

  // Prompt function for confirming task completion
  const confirmDoneChoice = async () => {
    if (!confirmDone) return true;

    const userConfirm = window.confirm("Are you sure you want to move this task to Done?");
    if (!userConfirm) return false;

    const userWantsToRemember = window.confirm("Remember this choice in the future?");
    if (userWantsToRemember) {
      setConfirmDone(false);
      setRememberChoice(true);
    }
    return true;
  };

  return { confirmDoneChoice, confirmDone, rememberChoice, setConfirmDone };
}
