import { existsSync } from "node:fs";
import type { Audit } from "kayle";
import {
    ensureDirectoryExists,
    logError,
    logInfo,
    sanitizeFolderName,
    writeJsonFile,
} from "../utils";
import type { CrawlConfig } from "./config";
import { Vnu } from "./vnu.class";

export class Reporter {
    private readonly reportDir: string =
        `${process.env.REPORT_PATH || "./reports"}/${process.env.ORIGIN || "default"}`;
    private readonly vnu?: Vnu;

    constructor(config?: CrawlConfig) {
        // Ensure the report directory exists
        ensureDirectoryExists(this.reportDir);

        // Initialize Nu HTML Checker when a config is present.
        if (config) {
            this.vnu = new Vnu(config.vnuConfig);
        } else {
            logInfo("Nu HTML Checker is not configured, skipping validation.");
        }
    }

    /**
     * Checks if a report file already exists for the given URL.
     */
    fileExists(url: string): boolean {
        const filename = this.generateFilename(url);
        return existsSync(filename);
    }

    /**
     * Saves the audit report to a file.
     */
    async saveReport(result: Audit): Promise<void> {
        if (!result) {
            logError("No result provided to save.");
            return;
        }

        const filename = this.generateFilename(result.pageUrl);

        const existingIssues = Array.isArray(result.issues)
            ? result.issues
            : [];

        // Fetch Nu HTML Checker issues and merge them with the audit results
        if (this.vnu) {
            const nuIssues = await this.vnu.getIssues(result.pageUrl);
            if (nuIssues.length > 0) {
                result.issues = [...existingIssues, ...nuIssues];
            } else {
                result.issues = existingIssues;
            }
        }

        try {
            writeJsonFile(filename, result);
            logInfo(`Report saved: ${filename}`);
        } catch (error) {
            logError(
                `Error saving report: ${error instanceof Error ? error.message : error}`,
            );
        }
    }

    /**
     * Generates a sanitized filename for the given URL.
     */
    private generateFilename(pageUrl: string): string {
        // remove origin and sanitize the URL
        const origin = process.env.ORIGIN || "default";
        const originIndex = pageUrl.indexOf(origin);
        const sanitizedUrl = sanitizeFolderName(
            pageUrl.slice(originIndex + origin.length),
        );
        return `${this.reportDir}/${sanitizedUrl || "index"}.json`;
    }
}
