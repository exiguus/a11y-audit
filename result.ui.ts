import { writeFileSync } from "node:fs";
import type {
	Results,
	ResultsEscaped,
	IssueCountEscaped,
} from "./result.config";
import { escapeHtml, escapeHtmlObject } from "./utils";
import { generateIndexHtml } from "./result.ui.index";
import { generateByCodeHtml } from "./result.ui.byCode";
import { generateByPageHtml } from "./result.ui.byPage";

const escapeDate = (rawData: Results): ResultsEscaped => ({
	datetime: escapeHtml(rawData.datetime),
	origin: escapeHtml(rawData.origin),
	overallAccessibilityScore: escapeHtml(
		rawData.overallAccessibilityScore.toString(),
	),
	totalIssues: escapeHtml(rawData.totalIssues.toString()),
	totalErrors: escapeHtml(rawData.totalErrors.toString()),
	totalWarnings: escapeHtml(rawData.totalWarnings.toString()),
	totalNotices: escapeHtml(rawData.totalNotices.toString()),
	totalPages: escapeHtml(rawData.totalPages.toString()),
	missingAltIndex: escapeHtml(rawData.missingAltIndex.toString()),
	wcagIssues: rawData.wcagIssues
		.map(
			(issue) =>
				escapeHtmlObject(issue, [
					"code",
					"type",
					"message",
					"count",
					"selector",
					"url",
				]) as IssueCountEscaped,
		)
		.map((issue: IssueCountEscaped) => ({
			...issue,
			code: issue.code.split(".").join(" "),
		})),
	axeIssues: rawData.axeIssues
		.map(
			(issue) =>
				escapeHtmlObject(issue, [
					"code",
					"type",
					"message",
					"count",
					"selector",
					"url",
				]) as IssueCountEscaped,
		)
		.map((issue: IssueCountEscaped) => ({
			...issue,
			code: issue.code.split(".").join(" "),
		})),
	selectorIssues: rawData.selectorIssues
		.map(
			(issue) =>
				escapeHtmlObject(issue, [
					"code",
					"type",
					"message",
					"count",
					"selector",
					"url",
				]) as IssueCountEscaped,
		)
		.map((issue: IssueCountEscaped) => ({
			...issue,
			code: issue.code.split(".").join(" "),
		})),
	issuesByCode: Object.entries(rawData.issuesByCode).reduce(
		(acc, [key, issue]) => {
			acc[key] = {
				count: escapeHtml(issue.count.toString()),
				code: escapeHtml(issue.code).split(".").join(" "),
				issues: (
					issue.issues.map((issue) =>
						escapeHtmlObject(issue, [
							"code",
							"type",
							"message",
							"count",
							"selector",
						]),
					) as IssueCountEscaped[]
				).map((issue: IssueCountEscaped) => ({
					...issue,
					code: issue.code.split(".").join(" "),
				})),
			};
			return acc;
		},
		{} as Record<
			string,
			{
				count: string;
				code: string;
				issues: IssueCountEscaped[];
			}
		>,
	),
	issuesByPage: Object.entries(rawData.issuesByPage).reduce(
		(acc, [key, issue]) => {
			acc[key] = {
				count: escapeHtml(issue.count.toString()),
				url: escapeHtml(issue.url),
				issues: (
					issue.issues.map((issue) =>
						escapeHtmlObject(issue, [
							"code",
							"type",
							"message",
							"count",
							"selector",
						]),
					) as IssueCountEscaped[]
				).map((issue: IssueCountEscaped) => ({
					...issue,
					code: issue.code.split(".").join(" "),
				})),
			};
			return acc;
		},
		{} as Record<
			string,
			{
				count: string;
				url: string;
				issues: IssueCountEscaped[];
			}
		>,
	),
});

export async function generateHtmlReport(data: Results): Promise<void> {
	const RESULT_DIR = `${process.env.RESULT_PATH || "./results"}/${process.env.ORIGIN || "default"}`;
	const OUTPUT_INDEX_HTML_PATH = `${RESULT_DIR}/index.html`;
	const OUTPUT_BYPAGE_HTML_PATH = `${RESULT_DIR}/issues-by-page.html`;
	const OUTPUT_BYCODE_HTML_PATH = `${RESULT_DIR}/issues-by-code.html`;
	const escapedData = escapeDate(data);
	writeFileSync(
		OUTPUT_INDEX_HTML_PATH,
		generateIndexHtml(escapedData),
		"utf-8",
	);
	writeFileSync(
		OUTPUT_BYPAGE_HTML_PATH,
		generateByPageHtml(escapedData),
		"utf-8",
	);
	writeFileSync(
		OUTPUT_BYCODE_HTML_PATH,
		generateByCodeHtml(escapedData),
		"utf-8",
	);
}
