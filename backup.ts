import { createArchive, getPaths, sanitizeFolderName } from "./utils";

function createBackup(
	backupDir: string,
	paths: string[],
	timestamp: string,
): void {
	for (const path of paths) {
		const folderName = sanitizeFolderName(path);
		const archivePath = `${backupDir}/${folderName}-${timestamp}.zip`;
		createArchive(archivePath, path);
	}
}

try {
	console.log("Starting backup process...");
	const sitemapDir = process.env.SITEMAP_PATH || "./sitemaps";
	const reportDir = process.env.REPORT_PATH || "./reports";
	const backupDir = process.env.BACKUP_PATH || "./backups";

	const sitemapPaths = getPaths(sitemapDir);
	const reportPaths = getPaths(reportDir);

	console.log(
		`Found ${sitemapPaths.length} sitemaps and ${reportPaths.length} reports.`,
	);

	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

	console.log(`Creating backups in directory: ${backupDir}`);
	createBackup(backupDir, sitemapPaths, timestamp);
	createBackup(backupDir, reportPaths, timestamp);

	console.log("Backup process completed successfully.");
} catch (error) {
	console.error(`Error during backup process: ${error.message}`);
}
