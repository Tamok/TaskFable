// frontend/src/utils/logger.js
import axios from "axios";
import CONFIG from "../config";

/**
 * Logs frontend events by sending them to the backend logs.
 */
export function logFrontendEvent(message) {
  console.log(message);
  axios.post(`${CONFIG.BACKEND_URL}/logs/frontend/append`, { message }, {
    headers: { "Content-Type": "application/json" }
  }).catch(err => console.error("Error logging frontend event", err));
}
