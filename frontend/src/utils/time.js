// frontend/src/utils/time.js
// Helper function to format timestamps based on a specified timezone.
import moment from "moment-timezone";

export function formatTimestamp(timestamp, timezone) {
  return moment.tz(timestamp, timezone).format("YYYY-MM-DD HH:mm:ss");
}
