import { readdirSync } from "node:fs";
import { join } from "node:path";
import type { IssueCount, Report } from "./config";
import {
	ensureDirectoryExists,
	getDateTime,
	logError,
	logInfo,
	readJsonFile,
	writeJsonFile,
} from "../utils";
import { generateHtmlReport } from "./ui/reports";
import { generateResultListing } from "./ui/resultListing";

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
						code: issue.code,
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
		{} as Record<string, IssueCount>,
	);

	return Object.entries(issuesMap)
		.map(([code, value]) => ({
			...value,
			code,
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
function calculateSelectorIssues(reports: Report[]): IssueCount[] {
	const selectorMap = reports.reduce(
		(acc, report) => {
			for (const issue of report.issues) {
				const key = issue.selector;
				if (!acc[key]) {
					acc[issue.selector] = {
						code: issue.code,
						type: issue.type,
						message: issue.message,
						selector: issue.selector,
						url: report.pageUrl,
						count: 1,
					};
				} else {
					acc[key].count++;
				}
			}
			return acc;
		},
		{} as Record<string, IssueCount>,
	);

	return Object.entries(selectorMap)
		.map(([selector, value]) => ({
			...value,
			selector,
		}))
		.sort((a, b) => b.count - a.count);
}

/**
 * Issues sorted by code
 */

function calculateIssuesByCode(reports: Report[]) {
	const issuesByCode = reports.reduce(
		(acc, report) => {
			for (const issue of report.issues) {
				const key = issue.code;
				if (!acc[key]) {
					acc[key] = {
						count: 1,
						code: issue.code,
						issues: [],
					};
				} else {
					acc[key].count++;
				}
				acc[key].issues.push({
					type: issue.type,
					message: issue.message,
					url: report.pageUrl,
					selector: issue.selector,
					count: acc[key].count,
					code: issue.code,
				});
			}
			return acc;
		},
		{} as Record<
			string,
			{
				count: number;
				code: string;
				issues: IssueCount[];
			}
		>,
	);

	// sort object keys by name
	const sortedKeys = Object.keys(issuesByCode).sort((a, b) =>
		a.localeCompare(b),
	);
	const sortedIssuesByCode = sortedKeys.reduce(
		(acc, key) => {
			acc[key] = issuesByCode[key];
			return acc;
		},
		{} as Record<string, { count: number; code: string; issues: IssueCount[] }>,
	);
	return sortedIssuesByCode;
}
/**
 * Issues sorted by page
 */

function calculateIssuesByPage(reports: Report[]) {
	const issuesByPage = reports.reduce(
		(acc, report) => {
			for (const issue of report.issues) {
				const key = report.pageUrl;
				if (!acc[key]) {
					acc[key] = {
						count: 1,
						url: report.pageUrl,
						issues: [],
					};
				} else {
					acc[key].count++;
				}
				acc[key].issues.push({
					type: issue.type,
					message: issue.message,
					url: report.pageUrl,
					selector: issue.selector,
					count: acc[key].count,
					code: issue.code,
				});
			}
			return acc;
		},
		{} as Record<
			string,
			{
				count: number;
				url: string;
				issues: IssueCount[];
			}
		>,
	);

	// sort object keys by name
	const sortedKeys = Object.keys(issuesByPage).sort((a, b) =>
		a.localeCompare(b),
	);
	const sortedIssuesByPage = sortedKeys.reduce(
		(acc, key) => {
			acc[key] = issuesByPage[key];
			return acc;
		},
		{} as Record<string, { count: number; url: string; issues: IssueCount[] }>,
	);

	// sort by count
	const sortedIssuesByPageCount = Object.entries(sortedIssuesByPage).sort(
		([, a], [, b]) => b.count - a.count,
	);
	const sortedIssuesByPageCountMap = sortedIssuesByPageCount.reduce(
		(acc, [key, value]) => {
			acc[key] = value;
			return acc;
		},
		{} as Record<string, { count: number; url: string; issues: IssueCount[] }>,
	);
	return sortedIssuesByPageCountMap;
}
/**
 * Issues sorted by selector
 */
function calculateIssuesBySelector(reports: Report[]) {
	const issuesBySelector = reports.reduce(
		(acc, report) => {
			for (const issue of report.issues) {
				const key = issue.selector;
				if (!acc[key]) {
					acc[key] = {
						count: 1,
						selector: issue.selector,
						issues: [],
					};
				} else {
					acc[key].count++;
				}
				acc[key].issues.push({
					type: issue.type,
					message: issue.message,
					url: report.pageUrl,
					selector: issue.selector,
					count: acc[key].count,
					code: issue.code,
				});
			}
			return acc;
		},
		{} as Record<
			string,
			{
				count: number;
				selector: string;
				issues: IssueCount[];
			}
		>,
	);

	// sort by count
	const sortedKeys = Object.keys(issuesBySelector).sort(
		(a, b) => issuesBySelector[b].count - issuesBySelector[a].count,
	);
	const sortedIssuesBySelector = sortedKeys.reduce(
		(acc, key) => {
			acc[key] = issuesBySelector[key];
			return acc;
		},
		{} as Record<
			string,
			{ count: number; selector: string; issues: IssueCount[] }
		>,
	);
	return sortedIssuesBySelector;
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
			datetime: getDateTime(),
			overallAccessibilityScore: calculateOverallAccessibilityScore(reports),
			...totals,
			missingAltIndex: calculateMissingAltIndex(reports),
			wcagIssues: issueCounts.filter((issue) => issue.code.startsWith("WCAG")),
			axeIssues: issueCounts.filter((issue) => !issue.code.startsWith("WCAG")),
			selectorIssues: calculateSelectorIssues(reports),
			issuesByCode: calculateIssuesByCode(reports),
			issuesByPage: calculateIssuesByPage(reports),
			issuesBySelector: calculateIssuesBySelector(reports),
		};

		const resultDir = `${process.env.RESULT_PATH || "./results"}/${process.env.ORIGIN || "default"}`;
		ensureDirectoryExists(resultDir);

		const resultFilePath = join(resultDir, "accessibility-report.json");
		writeJsonFile(resultFilePath, results);

		await generateHtmlReport(results);

		logInfo("Accessibility report generated successfully.");
	} catch (error) {
		logError(
			`Error generating accessibility report: ${error instanceof Error ? error.message : error}`,
		);
	}
}

export async function main(): Promise<void> {
	await generateAccessibilityReport();
	await generateResultListing();
}
