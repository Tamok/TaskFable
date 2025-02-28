// frontend/src/hooks/useConfirmDone.js
import { useState, useEffect } from "react";

// This hook returns a function that will prompt the user if needed
export function useConfirmDone() {
  const [confirmDone, setConfirmDone] = useState(true);   // whether to show the popup
  const [rememberChoice, setRememberChoice] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("confirmDone");
    if (stored) {
      const parsed = JSON.parse(stored);
      setConfirmDone(parsed.confirmDone);
      setRememberChoice(parsed.rememberChoice);
    }
  }, []);

  // Save to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(
      "confirmDone",
      JSON.stringify({ confirmDone, rememberChoice })
    );
  }, [confirmDone, rememberChoice]);

  // This function is called whenever user tries to move a card to Done
  const confirmDoneChoice = async () => {
    if (!confirmDone) {
      // The user previously said "don't ask me again," so just proceed
      return true;
    }

    // Show a popup
    const userConfirm = window.confirm("Are you sure you want to move this task to Done?");
    if (!userConfirm) {
      return false;
    }

    // If user clicked "OK", show a second check: "Remember my choice"?
    // For a simpler approach in code, we can do another confirm or a custom modal
    const userWantsToRemember = window.confirm("Remember this choice in the future?");
    if (userWantsToRemember) {
      setConfirmDone(false);
      setRememberChoice(true);
    }
    return true;
  };

  return { confirmDoneChoice, confirmDone, rememberChoice, setConfirmDone };
}
