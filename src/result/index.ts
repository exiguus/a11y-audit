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

type IssueSummary = Report["issues"][number];

type IssueGroup<T extends { count: number }> = T & {
    issues?: IssueCount[];
};

function createIssueSummary(
    report: Report,
    issue: IssueSummary,
    count: number,
): IssueCount {
    return {
        type: issue.type,
        message: issue.message,
        url: report.pageUrl,
        selector: issue.selector,
        count,
        code: issue.code,
    };
}

function sortGroupedEntries<T extends Record<string, { count: number }>>(
    groups: T,
    sortFn?: (a: [string, T[string]], b: [string, T[string]]) => number,
): T {
    const entries = Object.entries(groups) as [string, T[string]][];
    const sorted = (sortFn ? entries.sort(sortFn) : entries).reduce(
        (acc, [key, value]) => {
            acc[key] = value;
            return acc;
        },
        {} as T,
    );
    return sorted;
}

function groupIssuesBy<T extends { count: number }>(
    reports: Report[],
    getKey: (report: Report, issue: IssueSummary) => string,
    createGroup: (report: Report, issue: IssueSummary) => T,
    addIssue: (
        group: IssueGroup<T>,
        report: Report,
        issue: IssueSummary,
        count: number,
    ) => void,
): Record<string, T> {
    return reports.reduce<Record<string, T>>((acc, report) => {
        for (const issue of report.issues) {
            const key = getKey(report, issue);
            const group = acc[key] ?? createGroup(report, issue);
            const nextCount = "count" in group ? group.count + 1 : 1;

            group.count = nextCount;
            acc[key] = group;
            addIssue(group as IssueGroup<T>, report, issue, nextCount);
        }
        return acc;
    }, {});
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
    const files = readdirSync(reportDir).filter((file) =>
        file.endsWith(".json"),
    );
    const reports = await files.map((file) =>
        readJsonFile<Report>(join(reportDir, file)),
    );
    return process.env.RESULTS_IGNORE_WARNING ? filterIssues(reports) : reports;
}

/**
 * Calculates the issue counts from the reports.
 */
function calculateIssueCounts(reports: Report[]): IssueCount[] {
    const issuesMap = groupIssuesBy(
        reports,
        (_report, issue) => issue.code,
        (report, issue) => ({
            count: 1,
            type: issue.type,
            code: issue.code,
            message: issue.message,
            url: report.pageUrl,
            selector: issue.selector,
        }),
        () => undefined,
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

function filterIssueCountsByPrefix(
    issueCounts: IssueCount[],
    prefixes: string[],
): IssueCount[] {
    return issueCounts.filter((issue) =>
        prefixes.some((prefix) => issue.code.startsWith(prefix)),
    );
}

/**
 * Calculates the selector issues from the reports.
 */
function calculateSelectorIssues(reports: Report[]): IssueCount[] {
    const selectorMap = groupIssuesBy(
        reports,
        (_report, issue) => issue.selector,
        (report, issue) => ({
            count: 1,
            code: issue.code,
            type: issue.type,
            message: issue.message,
            selector: issue.selector,
            url: report.pageUrl,
        }),
        () => undefined,
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
    const issuesByCode = groupIssuesBy(
        reports,
        (_, issue) => issue.code,
        (_, issue) => ({
            count: 1,
            code: issue.code,
            issues: [],
        }),
        (group, report, issue, count) => {
            if (group.issues)
                group.issues.push(createIssueSummary(report, issue, count));
        },
    );

    return sortGroupedEntries(issuesByCode, ([a], [b]) => a.localeCompare(b));
}
/**
 * Issues sorted by page
 */

function calculateIssuesByPage(reports: Report[]) {
    const issuesByPage = groupIssuesBy(
        reports,
        (report) => report.pageUrl,
        (report) => ({
            count: 1,
            url: report.pageUrl,
            issues: [],
        }),
        (group, report, issue, count) => {
            if (group.issues)
                group.issues.push(createIssueSummary(report, issue, count));
        },
    );

    return sortGroupedEntries(
        issuesByPage,
        ([, a], [, b]) => b.count - a.count,
    );
}
/**
 * Issues sorted by selector
 */
function calculateIssuesBySelector(reports: Report[]) {
    const issuesBySelector = groupIssuesBy(
        reports,
        (_, issue) => issue.selector,
        (_, issue) => ({
            count: 1,
            selector: issue.selector,
            issues: [],
        }),
        (group, report, issue, count) => {
            if (group.issues)
                group.issues.push(createIssueSummary(report, issue, count));
        },
    );

    return sortGroupedEntries(
        issuesBySelector,
        ([, a], [, b]) => b.count - a.count,
    );
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
        totalIssues: reports.reduce(
            (acc, report) => acc + report.issues.length,
            0,
        ),
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

function buildIssueGroups(issueCounts: IssueCount[]) {
    return {
        wcagIssues: filterIssueCountsByPrefix(issueCounts, ["WCAG"]),
        axeIssues: issueCounts.filter(
            (issue) =>
                !issue.code.startsWith("WCAG") &&
                !issue.code.startsWith("NU-HTML"),
        ),
        nuHtmlIssues: filterIssueCountsByPrefix(issueCounts, ["NU-HTML"]),
    };
}

function buildResults(reports: Report[]) {
    const totals = calculateTotals(reports);
    const issueCounts = calculateIssueCounts(reports);

    return {
        origin: process.env.ORIGIN || "default",
        datetime: getDateTime(),
        overallAccessibilityScore: calculateOverallAccessibilityScore(reports),
        ...totals,
        missingAltIndex: calculateMissingAltIndex(reports),
        ...buildIssueGroups(issueCounts),
        selectorIssues: calculateSelectorIssues(reports),
        issuesByCode: calculateIssuesByCode(reports),
        issuesByPage: calculateIssuesByPage(reports),
        issuesBySelector: calculateIssuesBySelector(reports),
    };
}

/**
 * Generates the accessibility report.
 */
async function generateAccessibilityReport(): Promise<void> {
    try {
        const reports = await getReports();
        const results = buildResults(reports);

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
