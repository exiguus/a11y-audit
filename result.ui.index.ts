import type { ResultsEscaped, IssueCountEscaped } from "./result.config";
import { getHtmlLayout } from "./result.ui.templates";

export const generateIndexHtml = (data: ResultsEscaped): string =>
	getHtmlLayout({
		data,
		content: `<section id="wcag-issues">
      <h2>WCAG Issues</h2>
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
								(issue: IssueCountEscaped) => `
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
      <h2>Axe Issues</h2>
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
								(issue: IssueCountEscaped) => `
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
      <h2>Selector Issues</h2>
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
								(issue: IssueCountEscaped) => `
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
  `,
	});
