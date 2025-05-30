import type { ResultsEscaped, IssueCountEscaped } from "../config";
import { getHtmlLayout } from "./templates";

export const generateByPageHtml = (data: ResultsEscaped): string =>
	getHtmlLayout({
		type: "issues-by",
		data,
		content: `<section id="issues-by-page">
      <h2>Issues by Page</h2>
      <p>Issues are grouped by page. The page is a unique identifier for the issue.</p>
      <p>Issues are sorted by issue count in descending order.</p>
      ${
				Object.entries(data.issuesByCode).length > 0
					? `
        <p><button data-toggle-details-status="close" data-toggle-details>Toggle all details</button></p>
      `
					: ""
			}
      ${
				Object.entries(data.issuesByPage).length === 0
					? `
            <h3>Congratulations!</h3>
            <p>No issues found.</p>
          `
					: Object.entries(data.issuesByPage)
							.map(
								([key, value]) => `
        <details aria-labelledby="${value.url}">
          <summary>(${value.count}) ${key}</summary>
          <h3 id="${value.url}">${key}</h3>
          <h4>${value.count} Issues found.</h4>
          <p><a title="open page in new tab" href="${value.url}" target="_blank">${value.url}</a></p>
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
							.join("")
			}
    </section>`,
	});
