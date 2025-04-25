import { cleanDirectories, getPaths } from "../utils";

export function main(): void {
	try {
		console.log("Starting cleanup process...");
		const sitemapDir = process.env.SITEMAP_PATH || "./sitemaps";
		const reportDir = process.env.REPORT_PATH || "./reports";

		const sitemapPaths = getPaths(sitemapDir);
		const reportPaths = getPaths(reportDir);

		console.log(
			`Found ${sitemapPaths.length} sitemaps and ${reportPaths.length} reports.`,
		);

		console.log(`Cleaning directories: ${sitemapDir} and ${reportDir}`);
		cleanDirectories(sitemapPaths);
		cleanDirectories(reportPaths);

		console.log("Cleanup process completed successfully.");
	} catch (error) {
		console.error(`Error during cleanup process: ${error.message}`);
	}
}
