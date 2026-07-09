import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSync } from "esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = join(__dirname, "..");
const swSource = join(rootDir, "src", "service-worker", "sw.ts");
const swOutput = join(rootDir, "public", "sw.js");

try {
	buildSync({
		entryPoints: [swSource],
		bundle: true,
		minify: true,
		outfile: swOutput,
		format: "iife",
		target: "es2020",
		platform: "browser",
	});

	console.log("✓ Service Worker compiled successfully to", swOutput);
} catch (error) {
	console.error("❌ Service Worker compilation failed:", error);
	process.exit(1);
}
