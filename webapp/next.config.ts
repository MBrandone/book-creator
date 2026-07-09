import type { NextConfig } from "next";
import { publicEnvSchema } from "./src/config/env.schema";

const buildTimeEnv = publicEnvSchema.safeParse(process.env);

if (!buildTimeEnv.success) {
	console.error("❌ Build échoué : variables publiques invalides");
	console.error(buildTimeEnv.error.flatten().fieldErrors);
	process.exit(1);
}

const nextConfig: NextConfig = {};

export default nextConfig;
