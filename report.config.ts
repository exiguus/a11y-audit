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
}

export const defaultConfig: Partial<CrawlConfig> = {
	browserConfig: {
		headless: true,
		timeout: process.env.TIMEOUT ? Number.parseInt(process.env.TIMEOUT) : 30000,
	},
	kayleConfig: {
		includeWarnings: true,
		waitUntil: "networkidle",
		runners: ["htmlcs", "axe"],
		standard: Standard.WCAG2AA,
		timeout: process.env.TIMEOUT ? Number.parseInt(process.env.TIMEOUT) : 30000,
		language: process.env.LANGUAGE || "en",
	},
};
