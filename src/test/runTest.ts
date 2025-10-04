import * as path from 'path';
import { runTests } from '@vscode/test-electron';
import { fileURLToPath } from 'url';


// Für CJS/Node:
const thisFile = __filename;
const thisDir = __dirname;




async function main() {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../../../');

		// The path to the extension test script
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './suite/index');

		// Add arguments to run in a headless environment
		const launchArgs = [
			'--headless',
			'--no-sandbox',
			'--disable-gpu',
			'--disable-gpu-sandbox',
			'--disable-dev-shm-usage'
		];

		// Download VS Code, unzip it and run the integration test
		await runTests({
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs
		});
	} catch (err) {
		console.error(err);
		console.error('Failed to run tests');
		process.exit(1);
	}
}

main();