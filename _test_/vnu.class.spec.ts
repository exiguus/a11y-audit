import { beforeEach, expect, mock, test } from "bun:test";

const mockedCheck = mock(async (args: string[] = []) => {
    if (
        !Array.isArray(args) ||
        !args.includes("--format") ||
        !args.includes("json")
    ) {
        throw new Error("Invalid vnu arguments");
    }

    return JSON.stringify({
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
    });
});

mock.module("vnu-jar", () => ({
    vnu: { check: mockedCheck },
}));

const { Vnu } = await import("../src/report/vnu.class");

beforeEach(() => {
    mockedCheck.mockClear();
});

test("Vnu runs the local checker with JSON output for the page", async () => {
    const checker = new Vnu();

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
    expect(mockedCheck.mock.calls[0]?.[0]).toEqual(
        expect.arrayContaining([
            "--format",
            "json",
            "--exit-zero-always",
            "https://example.com",
        ]),
    );
});

test("Vnu forwards supported CLI options", async () => {
    const checker = new Vnu({
        format: "json",
        exitZeroAlways: true,
        errorsOnly: true,
        skipInfoMessages: true,
        userAgent: "a11y-audit/1.0",
    });

    await checker.fetchValidationResults("https://example.com");

    expect(mockedCheck.mock.calls[0]?.[0]).toEqual(
        expect.arrayContaining([
            "--format",
            "json",
            "--exit-zero-always",
            "--errors-only",
            "--skip-info-messages",
            "--user-agent",
            "a11y-audit/1.0",
            "https://example.com",
        ]),
    );
});

test("Vnu builds a more specific XPath from extract attributes", async () => {
    const checker = new Vnu();

    const issues = await checker.getIssues("https://example.com");
    const selector = issues[0]?.selector ?? "";

    expect(selector).toContain("//html");
    expect(selector).toMatch(/^\/\//);
});
