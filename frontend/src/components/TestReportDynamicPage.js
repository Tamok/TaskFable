import React, { useState, useEffect } from "react";
import axios from "axios";
import CONFIG from "../config";
import "./TestReportDynamicPage.css";

/**
 * Recursively flattens nested test results.
 *
 * @param {Array} results - Array of test result objects.
 * @returns {Array} - Flattened array of test case objects.
 */
function flattenResults(results) {
  let tests = [];
  results.forEach((item) => {
    if (item.result && Array.isArray(item.result) && item.result.length > 0) {
      tests = tests.concat(flattenResults(item.result));
    } else if (item.outcome && item.nodeid) {
      tests.push(item);
    }
  });
  return tests;
}

/**
 * Computes the total duration of a test case.
 * It sums up the durations for setup, call, and teardown if available.
 *
 * @param {Object} test - A test case object from the JSON report.
 * @returns {number} - Total duration in seconds.
 */
function computeTotalDuration(test) {
  let total = 0;
  if (test.setup && typeof test.setup.duration === "number") {
    total += test.setup.duration;
  }
  if (test.call && typeof test.call.duration === "number") {
    total += test.call.duration;
  }
  if (test.teardown && typeof test.teardown.duration === "number") {
    total += test.teardown.duration;
  }
  // Fallback if no phases provided.
  if (total === 0 && typeof test.duration === "number") {
    total = test.duration;
  }
  return total;
}

/**
 * Renders a nicely formatted details card for a test case.
 *
 * @param {Object} test - The test case object.
 * @returns {JSX.Element} - The details JSX.
 */
function TestDetails({ test }) {
  const totalDuration = computeTotalDuration(test).toFixed(2);
  return (
    <div className="test-details-card">
      <h3>Details for {test.nodeid}</h3>
      <div className="phase">
        <strong>Setup:</strong>{" "}
        {test.setup ? (
          <>
            <span className="duration">Duration: {test.setup.duration.toFixed(2)} s</span>{" "}
            <span className="outcome">Outcome: {test.setup.outcome}</span>
          </>
        ) : (
          <span>N/A</span>
        )}
      </div>
      <div className="phase">
        <strong>Call:</strong>{" "}
        {test.call ? (
          <>
            <span className="duration">Duration: {test.call.duration.toFixed(2)} s</span>{" "}
            <span className="outcome">Outcome: {test.call.outcome}</span>
          </>
        ) : (
          <span>N/A</span>
        )}
      </div>
      <div className="phase">
        <strong>Teardown:</strong>{" "}
        {test.teardown ? (
          <>
            <span className="duration">Duration: {test.teardown.duration.toFixed(2)} s</span>{" "}
            <span className="outcome">Outcome: {test.teardown.outcome}</span>
          </>
        ) : (
          <span>N/A</span>
        )}
      </div>
      <div className="total-duration">
        <strong>Total Duration:</strong> {totalDuration} s
      </div>
      {test.call && test.call.log && test.call.log.length > 0 && (
        <div className="logs">
          <strong>Logs:</strong>
          <ul>
            {test.call.log.map((logItem, idx) => (
              <li key={idx}>
                <em>{logItem.asctime}</em> – {logItem.levelname}: {logItem.msg}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * TestReportDynamicPage Component
 *
 * Fetches the JSON test report from the backend endpoint (/logs/test_report_json),
 * computes a total duration per test, and renders a table of test results.
 * Each row has an Expand/Collapse button that toggles a nicely formatted details card.
 */
function TestReportDynamicPage() {
  const [report, setReport] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await axios.get(`${CONFIG.BACKEND_URL}/logs/test_report_json`);
        setReport(res.data);
        // Use top-level "tests" if available; otherwise flatten "results"
        if (res.data.tests && Array.isArray(res.data.tests) && res.data.tests.length > 0) {
          setTestCases(res.data.tests);
        } else {
          const flatTests = flattenResults(res.data.results || []);
          setTestCases(flatTests);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching test report JSON:", err);
        setError("Failed to load test report.");
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  const toggleRow = (index) => {
    setExpandedRows((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  if (loading) {
    return <div>Loading test report...</div>;
  }
  if (error) {
    return <div className="error">{error}</div>;
  }
  if (!report) {
    return <div>No report data available.</div>;
  }

  // Extract summary information.
  const summary = report.summary || {};
  const total = summary.total || 0;
  const passed = summary.passed || 0;
  const failed = summary.failed || 0;
  const skipped = summary.skipped || 0;
  const lastRun = new Date().toLocaleString();

  return (
    <div className="test-report-dynamic">
      <h1>Test Report</h1>
      <p>
        <strong>Last Run:</strong> {lastRun}
      </p>
      <p>
        Total: {total} | <span className="passed">Passed: {passed}</span> |{" "}
        <span className="failed">Failed: {failed}</span> |{" "}
        <span className="skipped">Skipped: {skipped}</span>
      </p>
      <table>
        <thead>
          <tr>
            <th>Test Name</th>
            <th>Outcome</th>
            <th>Total Duration (s)</th>
            <th>Timestamp</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {testCases.length === 0 ? (
            <tr>
              <td colSpan="5">No test results found.</td>
            </tr>
          ) : (
            testCases.map((test, index) => {
              const testName = test.nodeid || "Unknown";
              const outcome = test.outcome || "unknown";
              // Compute total duration by summing setup, call, and teardown durations.
              const totalDuration = computeTotalDuration(test);
              const timestamp = lastRun; // Using overall lastRun timestamp for simplicity.
              const outcomeClass =
                outcome === "passed"
                  ? "passed"
                  : outcome === "failed"
                  ? "failed"
                  : "skipped";
              const checkmark =
                outcome === "passed" ? "✓" : outcome === "failed" ? "✗" : "";
              return (
                <React.Fragment key={index}>
                  <tr>
                    <td>{testName}</td>
                    <td className={outcomeClass}>
                      {outcome.charAt(0).toUpperCase() + outcome.slice(1)}{" "}
                      <span className="checkmark">{checkmark}</span>
                    </td>
                    <td>{totalDuration.toFixed(2)}</td>
                    <td>{timestamp}</td>
                    <td>
                      <button
                        className="btn small-btn"
                        onClick={() => toggleRow(index)}
                      >
                        {expandedRows[index] ? "Collapse" : "Expand"}
                      </button>
                    </td>
                  </tr>
                  {expandedRows[index] && (
                    <tr>
                      <td colSpan="5">
                        <TestDetails test={test} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default TestReportDynamicPage;
