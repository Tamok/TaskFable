// frontend/src/components/ChangelogPage.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import CONFIG from "../config";

function ChangelogPage() {
  const [changelog, setChangelog] = useState("");

  useEffect(() => {
    axios.get(`${CONFIG.BACKEND_URL}/other/changelog`)
      .then((res) => {
        setChangelog(res.data);
      })
      .catch((err) => {
        console.error("Error fetching changelog:", err);
        setChangelog("Failed to load changelog.");
      });
  }, []);

  return (
    <div className="changelog-page">
      <h2>Changelog</h2>
      {/* Wrap ReactMarkdown in a div with the desired className */}
      <div className="changelog-content">
        <ReactMarkdown>{changelog}</ReactMarkdown>
      </div>
    </div>
  );
}

export default ChangelogPage;
