import type { ResultsEscaped, IssueCountEscaped } from "../config";
import { getHtmlLayout } from "./templates";

export const generateBySelectorHtml = (data: ResultsEscaped): string =>
	getHtmlLayout({
		type: "issues-by",
		data,
		content: `<section id="issues-by-selector">
      <h2>Issues by Selector</h2>
      <p>Issues are grouped by selector. The selector is a unique identifier for the issue.</p>
      <p>Selector are sorted by issue count in descending order.</p>
      <p><button data-toggle-details-status="close" data-toggle-details>Toggle all details</button></p>
      ${
				Object.entries(data.issuesBySelector).length === 0
					? "<p>No issues found.</p>"
					: Object.entries(data.issuesBySelector)
							.map(
								([key, value]) => `
        <details aria-labelledby="${value.selector}">
          <summary>(${value.count}) ${key}</summary>
          <h3 id="${value.selector}">${key}</h3>
          <h4>${value.count} issues found.</h4>
          <p>${value.selector} selector.</p>
          ${
						value.issues.length === 0
							? "<p>No issues found.</p>"
							: `
            <table>
              <caption>Issues</caption>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Code</th>
                  <th>Message</th>
                  <th>Count</th>
                  <th>URL</th>
                </tr>
              </thead>
              <tbody>
                ${value.issues
									.map(
										(issue: IssueCountEscaped) => `
                  <tr>
                    <td class="${issue.type.toLowerCase()}">${issue.type}</td>
                    <td>${issue.code}</td>
                    <td>${issue.message}</td>
                    <td>${issue.count}</td>
                    <td><a title="Open external link" href="${issue.url}" target="_blank">View Issue</a></td>
                  </tr>
                `,
									)
									.join("")}
              </tbody>
            </table>
          `
					}
        </details>
        `,
							)
							.join("")
			}
    </section>`,
	});
