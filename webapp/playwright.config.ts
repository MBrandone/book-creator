import * as path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

const testEnv =
	config({ path: path.resolve(__dirname, ".env.test") }).parsed || {};

const isCI = !!process.env.CI;

export default defineConfig({
	testDir: "./tests/e2e",
	fullyParallel: true,
	forbidOnly: isCI,
	retries: isCI ? 2 : 0,
	workers: isCI ? 1 : undefined,
	reporter: "html",

	use: {
		baseURL: "http://localhost:3000",
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},

	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],

	webServer: {
		command: "npm run db:migrate && npm run dev",
		url: "http://localhost:3000",
		reuseExistingServer: !isCI,
		timeout: 120000,
		env: testEnv,
	},
});
