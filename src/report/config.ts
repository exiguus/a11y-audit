import { Standard } from "kayle";

export interface CrawlConfig {
    origin: string;
    browserConfig: {
        headless: boolean;
        timeout: number;
    };
    kayleConfig: {
        includeWarnings: boolean;
        waitUntil: "networkidle";
        runners: string[];
        standard: Standard;
        timeout: number;
        language: string;
    };
    vnuConfig: {
        errorsOnly?: boolean;
        skipInfoMessages?: boolean;
        userAgent?: string;
        additionalRequestHeaders?: string[];
    };
}

export const defaultConfig: Partial<CrawlConfig> = {
    browserConfig: {
        headless: true,
        timeout: process.env.TIMEOUT
            ? Number.parseInt(process.env.TIMEOUT, 10)
            : 30000,
    },
    kayleConfig: {
        includeWarnings: true,
        waitUntil: "networkidle",
        runners: ["htmlcs", "axe"],
        standard: Standard.WCAG2AA,
        timeout: process.env.TIMEOUT
            ? Number.parseInt(process.env.TIMEOUT, 10)
            : 30000,
        language: process.env.LANGUAGE || "en",
    },
    vnuConfig: {
        errorsOnly: process.env.RESULTS_IGNORE_WARNING === "true",
        userAgent: process.env.USER_AGENT || "a11y-audit/1.0",
        additionalRequestHeaders: [],
    },
};
