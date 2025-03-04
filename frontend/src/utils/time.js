// frontend/src/utils/time.js
import moment from "moment-timezone";

export function formatTimestamp(timestamp, timezone) {
  // If the timezone is given as a fixed offset (e.g. "UTC+05:00")
  if (timezone.startsWith("UTC")) {
    const match = timezone.match(/^UTC([+-])(\d{2}):(\d{2})$/);
    if (match) {
      const sign = match[1] === "+" ? 1 : -1;
      const hours = parseInt(match[2], 10);
      const minutes = parseInt(match[3], 10);
      const offsetMinutes = sign * (hours * 60 + minutes);
      return moment.utc(timestamp).utcOffset(offsetMinutes).format("YYYY-MM-DD HH:mm:ss");
    }
  }
  // Otherwise, assume it's a valid IANA timezone
  return moment.utc(timestamp).tz(timezone).format("YYYY-MM-DD HH:mm:ss");
}
