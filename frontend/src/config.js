// frontend/src/config.js
const CONFIG = {
  BACKEND_URL: "http://localhost:8000",
  POLL_INTERVAL: 5000, // ms
  VERSION: "0.2.3",
  TIMEZONES: [
    { value: "UTC-12:00", label: "UTC-12:00 (International Date Line West)" },
    { value: "UTC-11:00", label: "UTC-11:00 (Niue, American Samoa)" },
    { value: "UTC-10:00", label: "UTC-10:00 (Hawaii-Aleutian Standard Time)" },
    { value: "UTC-09:00", label: "UTC-09:00 (Alaska Standard Time)" },
    { value: "UTC-08:00", label: "UTC-08:00 (Pacific Standard Time)" },
    { value: "UTC-07:00", label: "UTC-07:00 (Mountain Standard Time)" },
    { value: "UTC-06:00", label: "UTC-06:00 (Central Standard Time)" },
    { value: "UTC-05:00", label: "UTC-05:00 (Eastern Standard Time)" },
    { value: "UTC-04:00", label: "UTC-04:00 (Atlantic Standard Time)" },
    { value: "UTC-03:00", label: "UTC-03:00 (Argentina, Brazil - Brasília)" },
    { value: "UTC-02:00", label: "UTC-02:00 (Mid-Atlantic)" },
    { value: "UTC-01:00", label: "UTC-01:00 (Azores, Cape Verde)" },
    { value: "UTC+00:00", label: "UTC+00:00 (Greenwich Mean Time)" },
    { value: "UTC+01:00", label: "UTC+01:00 (Central European Time)" },
    { value: "UTC+02:00", label: "UTC+02:00 (Eastern European Time)" },
    { value: "UTC+03:00", label: "UTC+03:00 (Moscow, East Africa Time)" },
    { value: "UTC+04:00", label: "UTC+04:00 (Gulf Standard Time)" },
    { value: "UTC+05:00", label: "UTC+05:00 (Pakistan Standard Time)" },
    { value: "UTC+06:00", label: "UTC+06:00 (Bangladesh Standard Time)" },
    { value: "UTC+07:00", label: "UTC+07:00 (Indochina Time)" },
    { value: "UTC+08:00", label: "UTC+08:00 (China Standard Time)" },
    { value: "UTC+09:00", label: "UTC+09:00 (Japan Standard Time)" },
    { value: "UTC+10:00", label: "UTC+10:00 (Australian Eastern Standard Time)" },
    { value: "UTC+11:00", label: "UTC+11:00 (Solomon Islands)" },
    { value: "UTC+12:00", label: "UTC+12:00 (New Zealand Standard Time)" },
    { value: "UTC+13:00", label: "UTC+13:00 (Phoenix Island Time)" },
    { value: "UTC+14:00", label: "UTC+14:00 (Line Islands)" }
  ]
};

export default CONFIG;
