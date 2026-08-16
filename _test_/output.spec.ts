import testJSON from "./accessibility-report.json";
import resultJSON from "../results/www.gattner.name/accessibility-report.json";
import { test, expect } from "bun:test";

test("Test result JSON exist", () => {
    if (!testJSON || !resultJSON) {
        throw new Error("One of the JSON files is undefined");
    }
});

test("Test result JSON structure", () => {
    // Compare the two JSON objects
    //   only compare keys and _not_ the values
    expect(Object.keys(testJSON)).toEqual(Object.keys(resultJSON));
});

test("Test result JSON value types", () => {
    // Compare the two JSON objects
    //   only compare the value types and _not_ the values
    for (const key in testJSON) {
        const testValue = testJSON?.[key as keyof typeof testJSON];
        const resultValue = resultJSON?.[key as keyof typeof resultJSON];
        expect(typeof testValue).toEqual(typeof resultValue);
    }
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
        expect(files.toString()).toMatch(/999?(-[0-9])\.json/);
    } else {
        throw new Error("The folder does not exist");
    }
});
