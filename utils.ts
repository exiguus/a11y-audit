import {
	createWriteStream,
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	rmdirSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { join } from "node:path";
import archiver from "archiver";
import axios from "axios";

/**
 * Ensures a directory exists, creating it if necessary.
 */
export function ensureDirectoryExists(directory: string): void {
	if (!existsSync(directory)) {
		mkdirSync(directory, { recursive: true });
	}
}

/**
 * Reads a JSON file and parses its content.
 */
export function readJsonFile<T>(filePath: string): T {
	const content = readFileSync(filePath, "utf-8");
	return JSON.parse(content) as T;
}

/**
 * Writes data to a JSON file.
 */
export function writeJsonFile(filePath: string, data: unknown): void {
	writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Sanitizes a folder name by replacing invalid characters.
 */
export function sanitizeFolderName(path: string): string {
	return path.replace(/\//g, "_").replace(/^_/, "").replace(/_$/, "");
}

/**
 * Cleans directories by removing their contents.
 */
export function cleanDirectories(paths: string[]): void {
	for (const path of paths) {
		rmDir(path);
	}
}

/**
 * Checks if a path is a directory.
 */
export function isDirectory(path: string): boolean {
	const stats = statSync(path);
	return stats.isDirectory();
}

/**
 * Retrieves all paths from a directory.
 */
export function getPaths(directory: string): string[] {
	const filePaths = readdirSync(directory);
	const folders = filePaths.filter((path) =>
		isDirectory(join(directory, path)),
	);
	return folders.map((folder) => join(directory, folder));
}

/**
 * Creates an archive from a source directory.
 */
export function createArchive(archivePath: string, source: string): void {
	logInfo(`Creating archive: ${archivePath} from source: ${source}`);
	const output = createWriteStream(archivePath);
	const archive = archiver("zip", { zlib: { level: 9 } });

	output.on("close", () => {
		logInfo(`Archive created: ${archivePath}`);
	});

	archive.on("error", (err) => {
		throw new Error(`Error creating archive: ${err.message}`);
	});

	archive.on("warning", (err) => {
		if (err.code === "ENOENT") {
			logWarn(`Warning during archive creation: ${err.message}`);
		} else {
			throw new Error(`Error during archive creation: ${err.message}`);
		}
	});

	archive.pipe(output);
	archive.directory(source, false);
	archive.finalize();
}

/**
 * Removes a directory and its contents.
 */
export function rmDir(path: string): void {
	if (!isDirectory(path)) {
		logWarn(`Path is not a directory: ${path}`);
		return;
	}
	try {
		rmdirSync(path, { recursive: true });
		logInfo(`Deleted directory: ${path}`);
	} catch (error) {
		logError(`Error deleting directory: ${path}. ${error.message}`);
	}
}

/**
 * Fetches data from a URL with retry logic.
 */
export async function fetchWithRetry(
	url: string,
	retries = 3,
): Promise<string> {
	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			const { data } = await axios.get(url);
			return data;
		} catch (error) {
			if (attempt === retries) {
				throw new Error(
					`Failed to fetch ${url} after ${retries} attempts: ${error.message}`,
				);
			}
			logWarn(`Retrying (${attempt}/${retries}) for ${url}...`);
		}
	}
	throw new Error(`Unexpected error while fetching ${url}`);
}

/**
 * Validates and retrieves an environment variable, providing a default if not set.
 */
export function getEnvVariable(name: string, defaultValue: string): string {
	return process.env[name] || defaultValue;
}

/**
 * Escape unsafe HTML characters in a string.
 */
export function escapeHtml(unsafe: string): string {
	const entityMap: { [key: string]: string } = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#39;",
		"/": "&#x2F;",
	};

	return unsafe.replace(/[&<>"'/]/g, (char) => entityMap[char]);
}
/**
 * Escapes unsafe HTML characters in an object.
 */
export const escapeHtmlObject = <T, R>(
	obj: T,
	keysToEscape: (keyof T)[],
): R => {
	return obj != null && typeof obj === "object"
		? (Object.fromEntries(
				Object.entries(obj).map(([key, value]) => {
					const escapedValue =
						keysToEscape.includes(key as keyof T) && typeof value === "string"
							? escapeHtml(value)
							: value?.toString
								? escapeHtml(value.toString())
								: value;
					return [key, escapedValue];
				}),
			) as R)
		: ((obj || "").toString() as R);
};

/**
 * Centralized logging utility.
 */
export function logInfo(message: string): void {
	console.log(`[INFO] ${message}`);
}

export function logWarn(message: string): void {
	console.warn(`[WARN] ${message}`);
}

export function logError(message: string): void {
	console.error(`[ERROR] ${message}`);
}
