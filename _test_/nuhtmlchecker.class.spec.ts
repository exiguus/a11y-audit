import { beforeEach, expect, mock, test } from "bun:test";

const mockedGet = mock(async (url: string, config?: Record<string, unknown>) => {
	if (typeof url !== "string") {
		throw new Error("URL missing");
	}
	if (config?.headers && typeof config.headers === "object") {
		return {
			data: {
				url,
				version: "1.0",
				messages: [
					{
						type: "error",
						subType: "error",
						message: "Missing doctype",
						firstLine: 1,
						lastLine: 1,
						firstColumn: 1,
						lastColumn: 1,
						extract: "<html>",
						hiliteStart: 0,
						hiliteLength: 6,
					},
				],
			},
		};
	}
	throw new Error("Missing user-agent header");
});

mock.module("axios", () => ({
	default: { get: mockedGet },
}));

const { NuHtmlChecker } = await import("../src/report/nuhtmlchecker.class");

beforeEach(() => {
	mockedGet.mockClear();
});

test("Nu HTML Checker sends a User-Agent header when validating a page", async () => {
	const checker = new NuHtmlChecker({
		origin: "https://example.com",
		browserConfig: { headless: true, timeout: 30000 },
		kayleConfig: {
			includeWarnings: true,
			waitUntil: "networkidle",
			runners: ["htmlcs"],
			standard: "WCAG2AA" as never,
			timeout: 30000,
			language: "en",
		},
		nuHtmlCheckerConfig: {
			url: "https://d",
			parser: "html5",
		},
	});

	const result = await checker.fetchValidationResults("https://example.com");
	const issues = checker.getIssues("https://example.com");

	expect(result?.messages).toHaveLength(1);
	expect((await issues)[0]).toEqual(
		expect.objectContaining({
			selector: "//html",
			context: expect.stringContaining("Missing doctype"),
			message: expect.stringContaining("Missing doctype"),
			code: expect.stringMatching(/^NU-HTML-[0-9]+$/),
		}),
	);
	expect(mockedGet.mock.calls[0]?.[1]).toEqual(
		expect.objectContaining({
			headers: expect.objectContaining({
				"User-Agent": expect.stringContaining("a11y-audit"),
			}),
		}),
	);
});

test("Nu HTML Checker builds a more specific XPath from extract attributes", async () => {
	const checker = new NuHtmlChecker({
		origin: "https://example.com",
		browserConfig: { headless: true, timeout: 30000 },
		kayleConfig: {
			includeWarnings: true,
			waitUntil: "networkidle",
			runners: ["htmlcs"],
			standard: "WCAG2AA" as never,
			timeout: 30000,
			language: "en",
		},
		nuHtmlCheckerConfig: {
			url: "https://validator.w3.org",
			parser: "html5",
		},
	});

	const issues = await checker.getIssues("https://example.com");
	const selector = issues[0]?.selector ?? "";

	expect(selector).toContain("//html");
	expect(selector).toMatch(/^\/\//);
});
