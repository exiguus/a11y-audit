import { readdirSync, writeFileSync } from "node:fs";
import { logInfo } from "../../utils";

export const generateResultListing = (): void => {
	const RESULT_DIR = `${process.env.RESULT_PATH || "./results"}`;
	// Get only directories in the result directory
	const directories = readdirSync(RESULT_DIR, { withFileTypes: true })
		.filter((dir) => dir.isDirectory())
		.map((dir) => dir.name);
	const dirList = directories.map((dir) => ({
		name: dir,
		url: `${dir}/index.html`,
	}));
	const htmlContent = template(dirList);
	const filePath = `${RESULT_DIR}/index.html`;
	writeFileSync(filePath, htmlContent);
	logInfo(`Result listing generated at ${filePath}`);
};

const template = (
	data: Array<{
		name: string;
		url: string;
	}>,
) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Result Listing</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f4f4f4;
    }
    h1 {
      color: #333;
    }
    ul {
      list-style-type: none;
      padding: 0;
    }
    li {
      margin: 5px 0;
    }
    a {
      text-decoration: none;
      color: #007bff;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <h1>Result Listing</h1>
  <ul>
    ${data.map((item) => `<li><a title="Results for ${item.name}" href="${item.url}">${item.name}</a></li>`).join("")}
  </ul>
</body>
</html>
`;
