import type { ResultsEscaped } from "../config";
import { getDateTime } from "../../utils";

const getProcessStatus = (score: number): string => {
	switch (true) {
		case score >= 90:
			return "success";
		case score >= 70:
			return "notice";
		case score >= 50:
			return "warning";
		default:
			return "error";
	}
};

export const getHtmlLayout = ({
	data,
	content,
}: {
	data: ResultsEscaped;
	content: string;
}): string => {
	const config = {
		processStatus: getProcessStatus(
			Number.parseInt(data.overallAccessibilityScore),
		),
	};
	return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Report ${data.origin}</title>
  <style>
    :root {
      --color: #333;
      --bg: #f4f4f9;
      --bs-danger: #dc3545;
      --bs-warning: #ffc107;
      --bs-success: #198754;
      --bs-info: #0dcaf0;
    }
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      background-color: var(--bg);
      color: var(--color);
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
      background: var(--bg);
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
      background: var(--bg);
    }
    progress[value] {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 20px;
    }
    progress[value]::-webkit-progress-bar {
      background-color: var(--bg);
      border-radius: 2px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1) inset;
    }
    progress[value]::-webkit-progress-value {
      border-radius: 2px;
      background-color: var(--bs-info);
    }
    progress.success[value]::-webkit-progress-value {
      background-color: var(--bs-success);
    }
    progress.warning[value]::-webkit-progress-value {
      background-color: var(--bs-warning);
    }
    progress.error[value]::-webkit-progress-value {
      background-color: var(--bs-danger);
    }
    .error {
      color: var(--bs-danger);
    }
    .warning {
      color: var(--bs-warning);
    }
    .notice {
      color: var(--bs-info);
    }
    .success {
      color: var(--bs-success);
    }
    .error-bg {
      background: var(--bs-danger);
    }
    .warning-bg {
      background: var(--bs-warning);
    }
    .notice-bg {
      background: var(--bs-info);
    }
    .success-bg {
      background: var(--bs-success);
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
    @media print {
      body {
        background: #fff;
        color: #000;
        max-width: 100%;
        margin: 0;
        padding: 0;
      }
      nav {
        display: none;
      }
      main {
        margin: 0;
        padding: 0;
        box-shadow: none;
        max-width: 100%;
      }
      header, footer {
        display: none;
      }
      table tr td:first-child {
        max-width: 230px;
        word-break: break-word;
      }
      a {
        color: #000;
        content: "";
        text-decoration: none;
      }
      a::after{
        content: " (" attr(href) ") ";
        word-break: break-word;
      }
      progress {
        display: none;
      }
      progress + br {
        display: none;
      }
    }
  </style>
</head>
<body>
  <header>
    <h1>Accessibility Report</h1>
    <h2 class="sr-only">${data.origin} by Page</h2>
  </header>
  <nav>
    <h2 id="toc" aria-hidden="true">Table of Content</h2>
    <ul aria-labelledby="toc">
      <li><a title="Goto Summary" href="#summary">Summary</a></li>
      <li><a title="Goto WCAG Issues" href="index.html#wcag-issues">WCAG Issues</a></li>
      <li><a title="Goto Axe Issues" href="index.html#axe-issues">Axe Issues</a></li>
      <li><a title="Goto Selector Issues" href="index.html#selector-issues">Selector Issues</a></li>
      <li><a title="Goto Issue by Code" href="issues-by-code.html#summary">Issues by Code</a></li>
      <li><a title="Goto Issue by Page" href="issues-by-page.html#summary">Issues by Page</a></li>
    </ul>
  </nav>
  <main>
    <details open aria-expanded="true" aria-labelledby="summary">
      <summary id="summary">
        <label class="sr-only" for="accessibility-score-process">Accessibility Score</label>
        <progress class="${config.processStatus}" id="accessibility-score-process" max="100" value="${data.overallAccessibilityScore}">${data.overallAccessibilityScore}%</progress>
        <br />Summary: (${data.totalIssues}) ${data.origin}
      </summary>
      <header aria-labelledby="summary-name">
        <h3 aria-hidden="true">${data.origin}</h3>
        <h4 id="summary-name">Summary</h4>
        <dl aria-label="Summary of the accessibility report">
          <dt>Origin</dt>
          <dd>${data.origin}</dd>
          <dt>Date</dt>
          <dd>${getDateTime()}</dd>
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
          <dt>Missing Alt Index</dt>
          <dd>${data.missingAltIndex}</dd>
          <dt>Overall Accessibility Score</dt>
          <dd class="${config.processStatus}"><strong>${data.overallAccessibilityScore}%</strong></dd>
        </dl>
      </header>
    </details>
    ${content}
  </main>
  <footer>
    <p>Accessibility Report <a title="view on github" href="https://github.com/exiguus/a11y-audit">a11y audit tools</a></p>
  </footer>
</body>
</html>
`;
};
