import axios from "axios";
import CONFIG from "../config";

export function logFrontendEvent(message) {
  console.log(message);
  axios.post(`${CONFIG.BACKEND_URL}/logs/frontend/append`, { message }, { headers: { "Content-Type": "application/json" } })
    .catch(err => console.error("Error logging frontend event", err));
}
