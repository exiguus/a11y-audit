import { backup, clean, report, result, scrape } from "./index.ts";

async function main() {
	const args = process.argv.slice(2);
	const command = args[0];

	switch (command) {
		case "backup":
			await backup.main();
			break;
		case "clean":
			await clean.main();
			break;
		case "report":
			await report.main();
			break;
		case "result":
			await result.main();
			break;
		case "scrape":
			await scrape.main();
			break;
		default:
			console.error("Unknown command:", command);
	}
}

main()
	.then(() => {
		console.log("Done.");
	})
	.catch((error) => {
		console.error("Error:", error);
	});
