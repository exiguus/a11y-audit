import testJSON from "./accessibility-report.json";
import resultJSON from "../results/www.gattner.name/accessibility-report.json";
import { test, expect } from "bun:test";

test("Test result JSON", () => {
	if (testJSON && resultJSON) {
		// ignore the datetime property
		testJSON.datetime = resultJSON.datetime;
	} else {
		throw new Error("One of the JSON files is undefined");
	}
	// Compare the two JSON objects
	expect(JSON.stringify(testJSON) === JSON.stringify(resultJSON)).toBe(true);
});

test("Test resport folder", () => {
	const testFolder = "./results/www.gattner.name/";
	const fs = require("node:fs");

	// Check if the folder exists
	if (fs.existsSync(testFolder)) {
		// Get the list of files in the folder
		const files = fs.readdirSync(testFolder);
		// Check if the accessibility-report.json file exists
		expect(files.toString()).toMatch(/\.json/);
	} else {
		throw new Error("The folder does not exist");
	}
});

test("Test sitemap folder", () => {
	const testFolder = "./sitemaps/www.gattner.name/";
	const fs = require("node:fs");

	// Check if the folder exists
	if (fs.existsSync(testFolder)) {
		// Get the list of files in the folder
		const files = fs.readdirSync(testFolder);
		// Check if the sitemap.xml file exists
		expect(files.toString()).toMatch(/999?(\-[0-9])\.json/);
	} else {
		throw new Error("The folder does not exist");
	}
});
