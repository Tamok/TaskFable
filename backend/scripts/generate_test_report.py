"""
backend/scripts/generate_test_report.py
-----------------------------------------
This script runs the pytest test suite with JSON reporting enabled,
reads the resulting JSON file, and then generates an HTML report that includes
a table with test results (test name, outcome, duration, and a timestamp).
The report adapts its styling for white and dark mode using media queries.
The generated HTML report is saved under backend/logs/tests/test_report.html.
"""

import subprocess
import json
import os
from datetime import datetime

# Define directories and file paths.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
REPORT_DIR = os.path.join(BASE_DIR, "..", "logs", "tests")
if not os.path.exists(REPORT_DIR):
    os.makedirs(REPORT_DIR)
    print(f"Created report directory at: {REPORT_DIR}")

JSON_REPORT_FILE = os.path.join(REPORT_DIR, "report.json")
HTML_REPORT_FILE = os.path.join(REPORT_DIR, "test_report.html")

def run_tests():
    """
    Run pytest with JSON reporting enabled.
    """
    print("Running pytest with JSON report...")
    cmd = ["pytest", "--json-report", f"--json-report-file={JSON_REPORT_FILE}"]
    result = subprocess.run(cmd, capture_output=True, text=True)
    print("Pytest stdout:")
    print(result.stdout)
    if result.stderr:
        print("Pytest stderr:")
        print(result.stderr)
    return result.returncode

def generate_html_report():
    """
    Read the JSON report and generate an HTML report.
    """
    print("Generating HTML report from JSON report...")
    try:
        with open(JSON_REPORT_FILE, "r", encoding="utf-8") as f:
            report = json.load(f)
    except Exception as e:
        print(f"Error reading JSON report: {e}")
        return

    # Extract summary information.
    summary = report.get("summary", {})
    total = summary.get("total", 0)
    passed = summary.get("passed", 0)
    failed = summary.get("failed", 0)
    skipped = summary.get("skipped", 0)
    last_run = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Start building the HTML content.
    html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Test Report</title>
  <style>
    body {{
      font-family: Arial, sans-serif;
      margin: 20px;
      background-color: #fff;
      color: #000;
    }}
    table {{
      border-collapse: collapse;
      width: 100%;
      margin-top: 20px;
    }}
    th, td {{
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }}
    th {{
      background-color: #f2f2f2;
    }}
    .passed {{
      color: green;
    }}
    .failed {{
      color: red;
    }}
    .skipped {{
      color: orange;
    }}
    .checkmark {{
      font-size: 1.2em;
    }}
    /* Dark mode styles */
    @media (prefers-color-scheme: dark) {{
      body {{
        background-color: #121212;
        color: #eee;
      }}
      th, td {{
        border-color: #444;
      }}
      th {{
        background-color: #333;
      }}
    }}
  </style>
</head>
<body>
  <h1>Test Report</h1>
  <p>Last Run: {last_run}</p>
  <p>Total: {total} | <span class="passed">Passed: {passed}</span> | 
     <span class="failed">Failed: {failed}</span> | 
     <span class="skipped">Skipped: {skipped}</span></p>
  <table>
    <tr>
      <th>Test Name</th>
      <th>Outcome</th>
      <th>Duration (s)</th>
      <th>Timestamp</th>
    </tr>
    """

    results = report.get("results", [])
    if not results:
        html += """
        <tr>
          <td colspan="4">No test results found.</td>
        </tr>
        """
    else:
        for item in results:
            test_name = item.get("nodeid", "Unknown")
            outcome = item.get("outcome", "unknown")
            duration = item.get("duration", 0)
            # Using the overall last_run as timestamp for simplicity.
            timestamp = last_run
            outcome_class = "passed" if outcome == "passed" else "failed" if outcome == "failed" else "skipped"
            checkmark = "&#10004;" if outcome == "passed" else "&#10008;" if outcome == "failed" else ""
            html += f"""
    <tr>
      <td>{test_name}</td>
      <td class="{outcome_class}">{outcome.capitalize()} <span class="checkmark">{checkmark}</span></td>
      <td>{duration:.2f}</td>
      <td>{timestamp}</td>
    </tr>
            """
    html += """
  </table>
</body>
</html>
    """
    with open(HTML_REPORT_FILE, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"HTML report generated at: {HTML_REPORT_FILE}")

if __name__ == "__main__":
    ret_code = run_tests()
    print("Pytest finished with return code:", ret_code)
    if ret_code == 0:
        generate_html_report()
    else:
        print("Tests failed. HTML report not generated.")
