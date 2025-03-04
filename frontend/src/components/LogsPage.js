// frontend/src/components/LogsPage.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import CONFIG from "../config";

function LogsPage() {
  const [backendLogs, setBackendLogs] = useState([]);
  const [frontendLogs, setFrontendLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [logContent, setLogContent] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const backendRes = await axios.get(`${CONFIG.BACKEND_URL}/logs/backend`);
      setBackendLogs(backendRes.data);
      const frontendRes = await axios.get(`${CONFIG.BACKEND_URL}/logs/frontend`);
      setFrontendLogs(frontendRes.data);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  const handleSelectLog = async (type, filename) => {
    try {
      const res = await axios.get(`${CONFIG.BACKEND_URL}/logs/${type}/${filename}`, { params: { lines: 100 } });
      setSelectedLog(filename);
      setLogContent(res.data.content);
    } catch (error) {
      console.error("Error fetching log content:", error);
    }
  };

  return (
    <div className="logs">
      <h2>Logs</h2>
      <div className="logs-section">
        <h3>Backend Logs</h3>
        <ul>
          {backendLogs.map((file) => (
            <li key={file}>
              <button onClick={() => handleSelectLog("backend", file)} className="btn">{file}</button>
            </li>
          ))}
        </ul>
      </div>
      <div className="logs-section">
        <h3>Frontend Logs</h3>
        <ul>
          {frontendLogs.map((file) => (
            <li key={file}>
              <button onClick={() => handleSelectLog("frontend", file)} className="btn">{file}</button>
            </li>
          ))}
        </ul>
      </div>
      {selectedLog && (
        <div>
          <h3>{selectedLog}</h3>
          <pre className="log-content">{logContent}</pre>
        </div>
      )}
    </div>
  );
}

export default LogsPage;
