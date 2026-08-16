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
    nuHtmlCheckerConfig?: {
        url: string;
        parser?: string;
        level?: string;
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
    nuHtmlCheckerConfig: {
        url: process.env.NU_HTML_CHECKER_URL || "https://validator.w3.org",
        parser: process.env.NU_HTML_CHECKER_PARSER || "html5",
        level: process.env.NU_HTML_CHECKER_LEVEL || "error",
    },
};
