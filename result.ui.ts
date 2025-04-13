import { writeFileSync } from "node:fs";
import type { IssueCount, SelectorCount, Results } from "./result.config";

/**
 * Generates the HTML content for the accessibility report.
 * @param data The data to populate the HTML content.
 * @return The generated HTML string.
 */
const generateHtml = (data: Results): string => {
	return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Report ${data.origin}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      background-color: #f4f4f9;
      color: #333;
    }
    header, footer {
      text-align: center;
    }
    nav {
      display: flex;
      position: sticky;
      top: 0;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
      background: #f4f4f9;
    }
    nav h2 {
      display: inline-block;
      font-size: inherit;
      line-height: inherit;
      padding: 0.25em 0 0.25em 0;
    }
    nav ul li {
      display: inline;
      padding: 0.5em;
    }
    main {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 1rem;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    main header {
      text-align: left;
    }
    main header dl {
      padding: 1em;
      border: 1px solid #ddd;
    }
    h1, h2 {
      color: #444;
    }
    dl {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 0.5rem;
    }
    dt {
      font-weight: bold;
      grid-column: 1;
    }
    dd {
      grid-column: 2;
      margin-left: 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }
    table caption {
      font-weight: bold;
      text-align: left;
      margin-bottom: 0.5rem;
    }
    table th, table td {
      border: 1px solid #ddd;
      padding: 0.8rem;
      text-align: left;
    }
    table th {
      background: #f4f4f9;
    }
    .error {
      color: #d9534f;
    }
    .warning {
      color: #f0ad4e;
    }
    .notice {
      color: #5bc0de;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      border: 0;
    }
  </style>
</head>
<body>
  <header>
    <h1>Accessibility Report</h1>
    <h2 class="sr-only">${data.origin}</h2>
  </header>
  <nav>
    <h2 id="toc" aria-hidden="true">Table of Content</h2>
    <ul aria-labelledby="toc">
      <li><a title="Goto Summary" href="#summary">Summary</a></li>
      <li><a title="Goto WCAG Issues" href="#wcag-issues">WCAG Issues</a></li>
      <li><a title="Goto Axe Issues" href="#axe-issues">Axe Issues</a></li>
      <li><a title="Goto Selector Issues" href="#selector-issues">Selector Issues</a></li>
    </ul>
  </nav>
  <main>
    <header aria-labelledby="summary">
      <h2 aria-hidden="true">${data.origin}</h2>
      <h1 id="summary">Summary</h1>
      <dl aria-label="Summary of the accessibility report">
        <dt>Origin</dt>
        <dd>${data.origin}</dd>
        <dt>Date</dt>
        <dd>${new Date(data.datetime).toLocaleDateString()}</dd>
        <dt>Overall Accessibility Score</dt>
        <dd>${data.overallAccessibilityScore}%</dd>
        <dt>Total Issues</dt>
        <dd>${data.totalIssues}</dd>
        <dt>Total Errors</dt>
        <dd>${data.totalErrors}</dd>
        <dt>Total Warnings</dt>
        <dd>${data.totalWarnings}</dd>
        <dt>Total Notices</dt>
        <dd>${data.totalNotices}</dd>
        <dt>Total Pages</dt>
        <dd>${data.totalPages}</dd>
      </dl>
    </header>
    <section id="wcag-issues">
      <h1>WCAG Issues</h1>
      ${
				data.wcagIssues.length === 0
					? "<p>No WCAG issues found.</p>"
					: `
        <table>
          <caption>WCAG Issues sorted by Count</caption>
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Message</th>
              <th>Count</th>
              <th>Selector</th>
              <th>URL</th>
            </tr>
          </thead>
          <tbody>
            ${data.wcagIssues
							.map(
								(issue: IssueCount) => `
              <tr>
                <td>${issue.code}</td>
                <td class="${issue.type.toLowerCase()}">${issue.type}</td>
                <td>${issue.message}</td>
                <td>${issue.count}</td>
                <td><code>${issue.selector}</code></td>
                <td><a title="Open external link" href="${issue.url}" target="_blank">View Issue</a></td>
              </tr>
            `,
							)
							.join("")}
          </tbody>
        </table>
      `
			}
    </section>
    <section id="axe-issues">
      <h1>Axe Issues</h1>
      ${
				data.axeIssues.length === 0
					? "<p>No Axe issues found.</p>"
					: `
        <table>
          <caption>Axe Issues sorted by Count</caption>
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Message</th>
              <th>Count</th>
              <th>Selector</th>
              <th>URL</th>
            </tr>
          </thead>
          <tbody>
            ${data.axeIssues
							.map(
								(issue: IssueCount) => `
              <tr>
                <td>${issue.code}</td>
                <td class="${issue.type.toLowerCase()}">${issue.type}</td>
                <td>${issue.message}</td>
                <td>${issue.count}</td>
                <td><code>${issue.selector}</code></td>
                <td><a title="Open external link" href="${issue.url}" target="_blank">View Issue</a></td>
              </tr>
            `,
							)
							.join("")}
          </tbody>
        </table>
      `
			}
    </section>
    <section id="selector-issues">
      <h1>Selector Issues</h1>
      ${
				data.selectorIssues.length === 0
					? "<p>No Selector issues found.</p>"
					: `
        <table>
          <caption>Selector Issues sorted by Count</caption>
          <thead>
            <tr>
              <th>Selector</th>
              <th>Type</th>
              <th>Message</th>
              <th>Count</th>
              <th>Code</th>
              <th>URL</th>
            </tr>
          </thead>
          <tbody>
            ${data.selectorIssues
							.map(
								(issue: SelectorCount) => `
              <tr>
                <td><code>${issue.selector}</code></td>
                <td class="${issue.type.toLowerCase()}">${issue.type}</td>
                <td>${issue.message}</td>
                <td>${issue.count}</td>
                <td>${issue.code}</td>
                <td><a title="Open external link" href="${issue.url}" target="_blank">View Issue</a></td>
              </tr>
            `,
							)
							.join("")}
          </tbody>
        </table>
      `
			}
    </section>
  </main>
  <footer>
    <p>Accessibility Report <a title="view on github" href="https://github.com/exiguus/a11y-audit">a11y audit tools</a></p>
  </footer>
</body>
</html>
  `;
};

export async function generateHtmlReport(data: Results): Promise<void> {
	const RESULT_DIR = `${process.env.RESULT_PATH || "./results"}/${process.env.ORIGIN || "default"}`;
	const OUTPUT_HTML_PATH = `${RESULT_DIR}/index.html`;
	writeFileSync(OUTPUT_HTML_PATH, generateHtml(data), "utf-8");
}
