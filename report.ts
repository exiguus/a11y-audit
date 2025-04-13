import { readFileSync, readdirSync } from "node:fs";
import { type Browser, chromium } from "@playwright/test";
import { type Audit, kayle, setLogging } from "kayle";
import { type CrawlConfig, defaultConfig } from "./report.config";
import { Reporter } from "./reporter.class";
import { logError, logInfo } from "./utils";

export class AccessibilityAuditor {
	private readonly reporter: Reporter;
	private readonly browser: Promise<Browser>;

	constructor(private readonly config: Partial<CrawlConfig>) {
		this.config = {
			...defaultConfig,
			...config,
			origin: `${process.env.ORIGIN || "default"}`,
		};
		this.reporter = new Reporter();
		this.validateConfig();
		this.browser = chromium.launch(config.browserConfig);
	}

	private validateConfig(): void {
		if (!this.config.kayleConfig) {
			throw new Error("kayleConfig is required");
		}
		if (!this.config.origin) {
			throw new Error("Missing required configuration: origin");
		}
	}

	async runAudit(): Promise<void> {
		try {
			logInfo("Starting accessibility audit...");
			const sitemap = this.loadSitemap();

			for (const url of sitemap) {
				this.config.origin = url;
				await this.auditUrl(this.config as CrawlConfig);
			}

			logInfo("Accessibility audit completed successfully.");
		} catch (error) {
			logError(
				`Error during audit: ${error instanceof Error ? error.message : error}`,
			);
		}
	}

	private loadSitemap(): string[] {
		try {
			const directory = `${process.env.SITEMAP_PATH || "./sitemaps"}/${process.env.ORIGIN || "default"}`;
			const files = readdirSync(directory);

			const jsonFiles = files.filter((file) => file.endsWith(".json"));
			if (jsonFiles.length === 0) {
				throw new Error("No JSON files found in the sitemaps directory");
			}

			const content: string[] = [];
			for (const file of jsonFiles) {
				const filePath = `${directory}/${file}`;
				const fileContent = readFileSync(filePath, "utf-8");
				const urls: string[] = JSON.parse(fileContent);
				const filteredUrls = urls.filter(
					(url) => !url.endsWith(".html") || url.slice(-8).match("."),
				);
				content.push(...filteredUrls);
			}
			logInfo(`Loaded ${content.length} URLs from sitemaps`);
			// remove doublicates and shuffle
			return Array.from(new Set(content)).sort(() => Math.random() - 0.5);
		} catch (error) {
			throw new Error(`Failed to load sitemap: ${error.message}`);
		}
	}

	private async auditUrl(config: CrawlConfig): Promise<void> {
		if (!config.origin) {
			throw new Error("Origin is required");
		}
		if (this.reporter.fileExists(config.origin)) {
			logInfo(`File already exists for ${config.origin}, skipping ...`);
			return;
		}

		const browser = await this.browser;
		const page = await browser.newPage();

		logInfo(`Auditing ${config.origin} ...`);
		let results: Audit | null = null;
		try {
			results = await kayle({
				page,
				browser,
				...config.kayleConfig,
				origin: config.origin,
			});
		} catch (error) {
			logError(
				`Error during audit: ${error instanceof Error ? error.message : error}`,
			);
		} finally {
			await page.close();
		}

		if (results) await this.reporter.saveReport(results);
	}
}

// Enable logging if needed
setLogging(!!process.env.DEBUG);

// Run the audit
(async () => {
	const auditor = new AccessibilityAuditor(defaultConfig);

	try {
		await auditor.runAudit();
		process.exit(0);
	} catch (error) {
		logError(`Error during audit: ${error.message}`);
		process.exit(1);
	}
})();
