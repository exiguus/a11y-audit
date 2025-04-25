import type { ResultsEscaped, IssueCountEscaped } from "../config";
import { getHtmlLayout } from "./templates";

export const generateByCodeHtml = (data: ResultsEscaped): string =>
	getHtmlLayout({
		data,
		content: `<section id="issues-by-code">
      <h2>Issues by Code</h2>
      <p><button data-toggle-details-status="close" data-toggle-details>Toggle all details</button></p>
      ${Object.entries(data.issuesByCode)
				.map(
					([key, value]) => `
        <details aria-labelledby="${value.code}">
          <summary>(${value.count}) ${key}</summary>
          <h3 id="${value.code}">${key}</h3>
          <h4>${value.count} issues found.</h4>
          <p>${value.code} issue code.</p>
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
                  <th>Selector</th>
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
        </details>
        `,
				)
				.join("")}
    </section>
  `,
	});
