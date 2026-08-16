import axios from "axios";
import type { Audit } from "kayle";
import { logError, logInfo, logWarn } from "../utils";
import type { CrawlConfig } from "./config";

const NU_HTML_CHECKER_USER_AGENT =
    "a11y-audit/1.0 (+https://github.com/exiguus/a11y-audit)";

/**
 * Interface for Nu HTML Checker message from the API
 */
interface NuHtmlCheckerMessage {
    type: string;
    subType?: string;
    message: string;
    firstLine: number;
    lastLine: number;
    firstColumn: number;
    lastColumn: number;
    extract: string;
    hiliteStart: number;
    hiliteLength: number;
}

/**
 * Interface for Nu HTML Checker response
 */
interface NuHtmlCheckerResponse {
    url: string;
    version: string;
    messages: NuHtmlCheckerMessage[];
}

/**
 * Nu HTML Checker service for fetching and parsing HTML validation issues
 */
export class NuHtmlChecker {
    private readonly issueCodeIndex = new Map<string, number>();

    constructor(private readonly config: CrawlConfig) { }

    /**
     * Fetches Nu HTML Checker validation results for a given URL
     */
    async fetchValidationResults(pageUrl: string): Promise<NuHtmlCheckerResponse | null> {
        if (!this.config.nuHtmlCheckerConfig) {
            logInfo("Nu HTML Checker is not configured, skipping validation.");
            return null;
        }

        // Validate that pageUrl is not empty
        if (!pageUrl || pageUrl.trim() === "") {
            logWarn("Nu HTML Checker: pageUrl is empty, skipping validation.");
            return null;
        }

        try {
            const { url: validatorUrl, parser = "html5", level } = this.config.nuHtmlCheckerConfig;

            const validationUrl = new URL(validatorUrl);
            validationUrl.searchParams.set("out", "json");
            validationUrl.searchParams.set("doc", pageUrl);
            validationUrl.searchParams.set("parser", parser);
            if (level) {
                validationUrl.searchParams.set("level", level);
            }

            const response = await axios.get<NuHtmlCheckerResponse>(validationUrl.toString(), {
                headers: {
                    Accept: "application/json",
                    "User-Agent": NU_HTML_CHECKER_USER_AGENT,
                },
            });

            const payload = response.data ?? { url: pageUrl, version: "unknown", messages: [] };
            return {
                url: payload.url || pageUrl,
                version: payload.version || "unknown",
                messages: Array.isArray(payload.messages) ? payload.messages : [],
            };
        } catch (error) {
            logError(
                `Error fetching Nu HTML Checker validation for ${pageUrl}: ${error instanceof Error ? error.message : error}`,
            );
            return null;
        }
    }

    /**
     * Maps Nu HTML Checker type to our internal type
     */
    private mapType(nuType: string, subType?: string): "error" | "warning" {
        // Nu HTML Checker uses:
        // - type: "error" for errors
        // - type: "info" with subType: "warning" for warnings
        // - type: "info" without subType for notices/info

        if (nuType === "error") {
            return "error";
        }

        if (subType === "warning") {
            return "warning";
        }

        // Default to notice for info messages without subtype
        return "warning";
    }

    /**
     * Maps Nu HTML Checker type to typeCode (for compatibility with existing code)
     */
    private mapTypeCode(nuType: string, subType?: string): number {
        // Type codes:
        // 1 = error
        // 2 = warning
        // 3 = notice

        if (nuType === "error") {
            return 1;
        }

        if (subType === "warning") {
            return 2;
        }

        return 3;
    }

    /**
     * Converts Nu HTML Checker issues to the format expected by the Report interface
     */
    private convertToReportIssues(
        messages: NuHtmlCheckerMessage[],
    ): Audit["issues"] {
        return messages.map((msg) => ({
            context: `Nu HTML Checker: ${msg.message}`,
            selector: this.buildXpathSelector(msg.extract, msg.firstLine),
            code: this.buildIssueCode(msg),
            type: this.mapType(msg.type, msg.subType),
            typeCode: this.mapTypeCode(msg.type, msg.subType),
            message: msg.message,
            runner: "nu" as const,
            recurrence: 1,
        }));
    }

    /**
     * Builds a stable issue code by assigning a numeric index to each unique message signature.
     */
    private buildIssueCode(msg: NuHtmlCheckerMessage): string {
        const signature = `${msg.type}:${msg.subType ?? ""}:${msg.message}`;
        const existingCode = this.issueCodeIndex.get(signature);
        if (existingCode !== undefined) {
            return `NU-HTML-${existingCode}`;
        }

        const nextCode = this.issueCodeIndex.size + 1;
        this.issueCodeIndex.set(signature, nextCode);
        return `NU-HTML-${nextCode}`;
    }

    /**
     * Builds a best-effort XPath selector from the validator extract snippet.
     * Falls back to a stable line-based selector when the snippet is missing or not parseable.
     */
    private buildXpathSelector(extract: string, firstLine: number): string {
        if (!extract || !extract.trim()) {
            return `line-${firstLine}`;
        }

        const match = extract.match(/<([a-z][a-z0-9]*)([^>]*)>/i);
        if (!match) {
            return `line-${firstLine}`;
        }

        const tagName = match[1].toLowerCase();
        const attrs = match[2] ?? "";
        const idMatch = attrs.match(/\b(?:id)\s*=\s*(?:"([^"]+)"|'([^']+)')/i);
        if (idMatch) {
            const id = idMatch[1] ?? idMatch[2];
            return `//*[@id='${id}']`;
        }

        const classMatch = attrs.match(/\b(?:class)\s*=\s*(?:"([^"]+)"|'([^']+)')/i);
        if (classMatch) {
            const classValue = (classMatch[1] ?? classMatch[2] ?? "").trim();
            if (classValue) {
                const firstClass = classValue.split(/\s+/)[0];
                if (firstClass) {
                    return `//${tagName}[@class='${classValue.split(/\s+/).join(" ")}']`;
                }
            }
        }

        const typeMatch = attrs.match(/\b(?:type)\s*=\s*(?:"([^"]+)"|'([^']+)')/i);
        if (typeMatch) {
            const type = typeMatch[1] ?? typeMatch[2];
            return `//${tagName}[@type='${type}']`;
        }

        return `//${tagName}`;
    }

    /**
     * Fetches Nu HTML Checker issues and merges them with existing audit results
     */
    async getIssues(pageUrl: string): Promise<Audit["issues"]> {
        this.issueCodeIndex.clear();
        const validationResult = await this.fetchValidationResults(pageUrl);

        if (!validationResult || !Array.isArray(validationResult.messages)) {
            return [];
        }

        return this.convertToReportIssues(validationResult.messages);
    }
}
