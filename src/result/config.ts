export interface Report {
	documentTitle: string;
	pageUrl: string;
	issues: {
		context: string;
		selector: string;
		code: string;
		type: "error" | "warning" | "notice";
		typeCode: number;
		message: string;
		runner: "htmlcs" | "axe";
		recurrence: number;
	}[];
	meta: {
		errorCount: number;
		warningCount: number;
		noticeCount: number;
		accessScore: number;
	};
	automateable: {
		missingAltIndexs: number[];
	};
}

export interface IssueCount {
	code: string;
	type: Report["issues"][number]["type"];
	message: string;
	url: string;
	selector: string;
	count: number;
}

export interface Results {
	origin: string;
	datetime: string;
	overallAccessibilityScore: number;
	totalIssues: number;
	totalErrors: number;
	totalWarnings: number;
	totalNotices: number;
	totalPages: number;
	missingAltIndex: number;
	wcagIssues: IssueCount[];
	axeIssues: IssueCount[];
	selectorIssues: IssueCount[];
	issuesByCode: Record<
		string,
		{
			count: number;
			code: string;
			issues: IssueCount[];
		}
	>;
	issuesByPage: Record<
		string,
		{
			count: number;
			url: string;
			issues: IssueCount[];
		}
	>;
	issuesBySelector: Record<
		string,
		{
			count: number;
			selector: string;
			issues: IssueCount[];
		}
	>;
}

export interface IssueCountEscaped {
	code: string;
	type: string;
	message: string;
	url: string;
	selector: string;
	count: string;
}

export interface ResultsEscaped {
	origin: string;
	datetime: string;
	overallAccessibilityScore: string;
	totalIssues: string;
	totalErrors: string;
	totalWarnings: string;
	totalNotices: string;
	totalPages: string;
	missingAltIndex: string;
	wcagIssues: IssueCountEscaped[];
	axeIssues: IssueCountEscaped[];
	selectorIssues: IssueCountEscaped[];
	issuesByCode: Record<
		string,
		{
			count: string;
			code: string;
			issues: IssueCountEscaped[];
		}
	>;
	issuesByPage: Record<
		string,
		{
			count: string;
			url: string;
			issues: IssueCountEscaped[];
		}
	>;
	issuesBySelector: Record<
		string,
		{
			count: string;
			selector: string;
			issues: IssueCountEscaped[];
		}
	>;
}
