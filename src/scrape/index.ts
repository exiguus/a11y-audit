import * as xml2js from "xml2js";
import {
	ensureDirectoryExists,
	fetchWithRetry,
	logError,
	logInfo,
	logWarn,
	writeJsonFile,
} from "../utils";

class SitemapScraper {
	private readonly outputDir: string;

	constructor(
		private readonly xmlParser = new xml2js.Parser(),
		outputDir = `${process.env.SITEMAP_PATH || "./sitemaps"}/${process.env.ORIGIN || "default"}`,
	) {
		this.outputDir = outputDir;
		ensureDirectoryExists(this.outputDir);
	}

	private async fetchSitemapLinks(url: string): Promise<string[]> {
		logInfo(`Fetching ${url}...`);
		try {
			const data = await fetchWithRetry(url);
			const { sitemaps, urls } = await this.parseSitemap(data);

			const links: string[] = [...urls];
			for (const sitemapUrl of sitemaps) {
				const nestedLinks = await this.fetchSitemapLinks(sitemapUrl);
				links.push(...nestedLinks);
			}

			logInfo(`Found ${links.length} links in ${url}`);
			return links;
		} catch (error) {
			logError(
				`Error fetching sitemap ${url}: ${error instanceof Error ? error.message : error}`,
			);
			return [];
		}
	}

	private async parseSitemap(
		data: string,
	): Promise<{ sitemaps: string[]; urls: string[] }> {
		const result = await this.xmlParser.parseStringPromise(data);

		const sitemaps =
			result.sitemapindex?.sitemap
				?.map((entry: { loc: string[] }) => entry.loc?.[0])
				.filter((url): url is string => !!url) || [];

		const urls =
			result.urlset?.url
				?.map((entry: { loc: string[] }) => entry.loc?.[0])
				.filter((url): url is string => !!url) || [];

		return { sitemaps, urls };
	}

	async saveSitemapLinks(
		links: string[],
		index: number,
		sourceUrl?: string,
	): Promise<void> {
		const chunkSize = 1000;
		for (let i = 0; i < links.length; i += chunkSize) {
			const chunk = links.slice(i, i + chunkSize);
			const filename = `${this.outputDir}/${index}-${Math.floor(i / chunkSize)}.json`;
			writeJsonFile(filename, chunk);
			logInfo(`Saved ${chunk.length} links to ${filename}`);
		}
	}

	async scrapeAll(sitemaps: string[]): Promise<void> {
		logInfo(`Starting to scrape ${sitemaps.length} sitemaps...`);

		for (const [i, sitemap] of sitemaps.entries()) {
			logInfo(`Processing sitemap ${i + 1}/${sitemaps.length}`);
			const links = await this.fetchSitemapLinks(sitemap);
			await this.saveSitemapLinks(links, i, sitemap);
		}

		logInfo("All sitemaps processed.");
	}
}

export async function main(): Promise<void> {
	try {
		const urlList = JSON.parse(process.env.URL_LIST || "[]");
		const siteMaps = JSON.parse(process.env.SITEMAP_URLS || "[]");

		const scraper = new SitemapScraper();
		switch (true) {
			// biome-ignore lint/suspicious/noFallthroughSwitchClause: false
			case urlList.length > 0:
				await scraper.saveSitemapLinks(urlList, 999, "URL_LIST");
			// biome-ignore lint/suspicious/noFallthroughSwitchClause: false
			case siteMaps.length > 0:
				await scraper.scrapeAll(siteMaps);
			default:
				logWarn("No URL list or sitemaps provided");
		}
	} catch (error) {
		logError(`Error: ${error instanceof Error ? error.message : error}`);
	}
}
