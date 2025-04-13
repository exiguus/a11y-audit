import { readdirSync } from "node:fs";
import { join } from "node:path";
import {
	ensureDirectoryExists,
	logError,
	logInfo,
	readJsonFile,
	writeJsonFile,
} from "./utils";

interface Report {
	documentTitle: string;
	pageUrl: string;
	issues: {
		context: string;
		selector: string;
		code: string;
		type: "error" | "warning" | "notice";
		typeCode: number;
		message: string;
		runner: "htmlcs" | "axe";
		recurrence: number;
	}[];
	meta: {
		errorCount: number;
		warningCount: number;
		noticeCount: number;
		accessScore: number;
	};
	automateable: {
		missingAltIndexs: number[];
	};
}

interface IssueCount {
	code: string;
	type: Report["issues"][number]["type"];
	message: string;
	url: string;
	selector: string;
	count: number;
}

interface SelectorCount {
	code: string;
	type: Report["issues"][number]["type"];
	message: string;
	url: string;
	count: number;
}

/**
 * Filters issues based on the environment variable.
 */
function filterIssues(reports: Report[]): Report[] {
	const ignoreWarning = process.env.RESULTS_IGNORE_WARNING === "true";
	return reports.map((report) => ({
		...report,
		issues: report.issues.filter((issue) => {
			if (ignoreWarning && issue.type === "warning") {
				return false;
			}
			return true;
		}),
	}));
}

/**
 * Retrieves all reports from the report directory.
 */
async function getReports(): Promise<Report[]> {
	const reportDir = `${process.env.REPORT_PATH || "./reports"}/${process.env.ORIGIN || "default"}`;
	const files = readdirSync(reportDir).filter((file) => file.endsWith(".json"));
	const reports = await files.map((file) =>
		readJsonFile<Report>(join(reportDir, file)),
	);
	return process.env.RESULTS_IGNORE_WARNING ? filterIssues(reports) : reports;
}

/**
 * Calculates the issue counts from the reports.
 */
function calculateIssueCounts(reports: Report[]): IssueCount[] {
	const issuesMap = reports.reduce(
		(acc, report) => {
			for (const issue of report.issues) {
				const key = issue.code;
				if (!acc[key]) {
					acc[key] = {
						count: 1,
						type: issue.type,
						message: issue.message,
						url: report.pageUrl,
						selector: issue.selector,
					};
				} else {
					acc[key].count++;
				}
			}
			return acc;
		},
		{} as Record<string, Omit<IssueCount, "code">>,
	);

	return Object.entries(issuesMap)
		.map(([code, value]) => ({
			code,
			...value,
		}))
		.sort((a, b) => b.count - a.count);
}

function calculateMissingAltIndex(reports: Report[]): number {
	return reports
		.flatMap((report) => report.automateable.missingAltIndexs)
		.reduce((acc, current) => acc + current, 0);
}

/**
 * Calculates the selector issues from the reports.
 */
function calculateSelectorIssues(reports: Report[]): SelectorCount[] {
	const selectorMap = reports.reduce(
		(acc, report) => {
			for (const issue of report.issues) {
				const key = issue.selector;
				if (!acc[key]) {
					acc[issue.selector] = {
						code: issue.code,
						type: issue.type,
						message: issue.message,
						url: report.pageUrl,
						count: 1,
					};
				} else {
					acc[key].count++;
				}
			}
			return acc;
		},
		{} as Record<string, Omit<SelectorCount, "selector">>,
	);

	return Object.entries(selectorMap)
		.map(([selector, value]) => ({
			selector,
			...value,
		}))
		.sort((a, b) => b.count - a.count);
}

/**
 * Calculates the overall accessibility score from the reports.
 */
function calculateOverallAccessibilityScore(reports: Report[]): number {
	return Math.round(
		reports.reduce((acc, report) => acc + report.meta.accessScore, 0) /
			reports.length,
	);
}

/**
 * Calculates totals for issues, errors, warnings, notices, and pages.
 */
function calculateTotals(reports: Report[]) {
	return {
		totalIssues: reports.reduce((acc, report) => acc + report.issues.length, 0),
		totalErrors: reports.reduce(
			(acc, report) => acc + report.meta.errorCount,
			0,
		),
		totalWarnings: reports.reduce(
			(acc, report) => acc + report.meta.warningCount,
			0,
		),
		totalNotices: reports.reduce(
			(acc, report) => acc + report.meta.noticeCount,
			0,
		),
		totalPages: reports.length,
	};
}

/**
 * Generates the accessibility report.
 */
async function generateAccessibilityReport(): Promise<void> {
	try {
		const reports = await getReports();
		const totals = calculateTotals(reports);
		const issueCounts = calculateIssueCounts(reports);

		const results = {
			origin: process.env.ORIGIN || "default",
			datetime: new Date().toISOString(),
			overallAccessibilityScore: calculateOverallAccessibilityScore(reports),
			...totals,
			missingAltIndex: calculateMissingAltIndex(reports),
			wcagIssues: issueCounts.filter((issue) => issue.code.startsWith("WCAG")),
			axeIssues: issueCounts.filter((issue) => !issue.code.startsWith("WCAG")),
			selectorIssues: calculateSelectorIssues(reports),
		};

		const resultDir = `${process.env.RESULT_PATH || "./results"}/${process.env.ORIGIN || "default"}`;
		ensureDirectoryExists(resultDir);

		const resultFilePath = join(resultDir, "accessibility-report.json");
		writeJsonFile(resultFilePath, results);

		logInfo("Accessibility report generated successfully.");
	} catch (error) {
		logError(
			`Error generating accessibility report: ${error instanceof Error ? error.message : error}`,
		);
	}
}

// Execute the report generation
(async () => {
	await generateAccessibilityReport();
})();
