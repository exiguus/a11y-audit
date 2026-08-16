import type { Audit } from "kayle";
import { logError, logWarn } from "../utils";

interface VnuMessage {
    type: string;
    subType?: string;
    message: string;
    firstLine?: number;
    lastLine?: number;
    firstColumn?: number;
    lastColumn?: number;
    extract?: string;
    hiliteStart?: number;
    hiliteLength?: number;
}

interface VnuResponse {
    version: string;
    messages: VnuMessage[];
}

export interface VnuOptions {
    format?: "gnu" | "xml" | "json" | "text";
    exitZeroAlways?: boolean;
    errorsOnly?: boolean;
    skipInfoMessages?: boolean;
    userAgent?: string;
    additionalRequestHeaders?: string[];
}

export class Vnu {
    private readonly issueCodeIndex = new Map<string, number>();
    private readonly options: VnuOptions;

    constructor(options: VnuOptions = {}) {
        this.options = options;
    }

    private getArgs(pageUrl: string): string[] {
        const args = ["--format", this.options.format ?? "json"];

        if (this.options.exitZeroAlways ?? true) {
            args.push("--exit-zero-always");
        }

        if (this.options.errorsOnly) {
            args.push("--errors-only");
        }

        if (this.options.skipInfoMessages) {
            args.push("--skip-info-messages");
        }

        if (this.options.userAgent) {
            args.push("--user-agent", this.options.userAgent);
        }

        for (const header of this.options.additionalRequestHeaders ?? []) {
            args.push("--additional-request-header", header);
        }

        args.push(pageUrl);
        return args;
    }

    private hasJavaRuntime(): boolean {
        const { spawnSync } = require("node:child_process");
        const result = spawnSync("java", ["-version"], {
            stdio: "ignore",
        });

        return !result.error && result.status === 0;
    }

    async fetchValidationResults(pageUrl: string): Promise<VnuResponse | null> {
        if (!pageUrl || pageUrl.trim() === "") {
            logWarn("Nu HTML Checker: pageUrl is empty, skipping validation.");
            return null;
        }

        if (!this.hasJavaRuntime()) {
            logWarn(
                "Nu HTML Checker requires Java 17+ to be installed and available on PATH. Install Java before running the validator.",
            );
            return null;
        }

        try {
            const { vnu } = await import("vnu-jar");
            const args = this.getArgs(pageUrl);

            const output = await vnu.check(args);
            const payload = output
                ? (JSON.parse(output) as Partial<VnuResponse>)
                : null;

            return {
                version: payload?.version || "unknown",
                messages: Array.isArray(payload?.messages)
                    ? payload.messages
                    : [],
            };
        } catch (error) {
            logError(
                `Error fetching Nu HTML Checker validation for ${pageUrl}: ${error instanceof Error ? error.message : error}`,
            );
            return null;
        }
    }

    private mapType(nuType: string, subType?: string): "error" | "warning" {
        if (subType === "warning") {
            return "warning";
        }
        return nuType === "error" ? "error" : "warning";
    }

    private mapTypeCode(nuType: string, subType?: string): number {
        if (nuType === "error") {
            return 1;
        }

        if (subType === "warning") {
            return 2;
        }

        return 3;
    }

    private convertToReportIssues(messages: VnuMessage[]): Audit["issues"] {
        return messages.map((msg) => ({
            context: `Nu HTML Checker: ${msg.message}`,
            selector: this.buildXpathSelector(msg.extract, msg.firstLine),
            code: this.buildIssueCode(msg),
            type: this.mapType(msg.type, msg.subType),
            typeCode: this.mapTypeCode(msg.type, msg.subType),
            message: msg.message,
            runner: "nu" as const,
            runnerExtras: {
                firstLine: msg.firstLine,
                lastLine: msg.lastLine,
                firstColumn: msg.firstColumn,
                lastColumn: msg.lastColumn,
                extract: msg.extract,
                hiliteStart: msg.hiliteStart,
                hiliteLength: msg.hiliteLength,
            },
            recurrence: 1,
        }));
    }

    private buildIssueCode(msg: VnuMessage): string {
        const signature = `${msg.type}:${msg.subType ?? ""}:${msg.message}`;
        const existingCode = this.issueCodeIndex.get(signature);
        if (existingCode !== undefined) {
            return `NU-HTML-${existingCode}`;
        }

        const nextCode = this.issueCodeIndex.size + 1;
        this.issueCodeIndex.set(signature, nextCode);
        return `NU-HTML-${nextCode}`;
    }

    private buildXpathSelector(extract?: string, firstLine?: number): string {
        if (!extract?.trim()) {
            return `line-${firstLine ?? 1}`;
        }

        const match = extract.match(/<([a-z][a-z0-9]*)([^>]*)>/i);
        if (!match) {
            return `line-${firstLine ?? 1}`;
        }

        const tagName = match[1].toLowerCase();
        const attrs = match[2] ?? "";
        const idMatch = attrs.match(/\b(?:id)\s*=\s*(?:"([^"]+)"|'([^']+)')/i);
        if (idMatch) {
            const id = idMatch[1] ?? idMatch[2];
            return `//*[@id='${id}']`;
        }

        const classMatch = attrs.match(
            /\b(?:class)\s*=\s*(?:"([^"]+)"|'([^']+)')/i,
        );
        if (classMatch) {
            const classValue = (classMatch[1] ?? classMatch[2] ?? "").trim();
            if (classValue) {
                const normalized = classValue.split(/\s+/).join(" ");
                return `//${tagName}[@class='${normalized}']`;
            }
        }

        const typeMatch = attrs.match(
            /\b(?:type)\s*=\s*(?:"([^"]+)"|'([^']+)')/i,
        );
        if (typeMatch) {
            const type = typeMatch[1] ?? typeMatch[2];
            return `//${tagName}[@type='${type}']`;
        }

        return `//${tagName}`;
    }

    async getIssues(pageUrl: string): Promise<Audit["issues"]> {
        this.issueCodeIndex.clear();
        const validationResult = await this.fetchValidationResults(pageUrl);

        if (!validationResult || !Array.isArray(validationResult.messages)) {
            return [];
        }

        return this.convertToReportIssues(validationResult.messages);
    }
}
