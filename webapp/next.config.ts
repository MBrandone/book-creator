import type { NextConfig } from "next";
import { publicEnvSchema } from "@/config/env.schema";

const buildTimeEnv = publicEnvSchema.safeParse(process.env);

if (!buildTimeEnv.success) {
	console.error("❌ Build échoué : variables publiques invalides");
	console.error(buildTimeEnv.error.flatten().fieldErrors);
	process.exit(1);
}

const nextConfig: NextConfig = {
	distDir: process.env.NEXT_DIST_DIR ?? ".next",
	images: {
		dangerouslyAllowLocalIP: true,
		remotePatterns: [
			{
				protocol: "http",
				hostname: "localhost",
				port: "9000",
				pathname: "/book-images/**",
			},
			{
				protocol: "http",
				hostname: "localhost",
				port: "9010",
				pathname: "/book-images-test/**",
			},
			{
				protocol: "https",
				hostname: "zwuapejxeikbtnrumwtt.supabase.co",
				pathname: "/storage/v1/object/public/book-images/**",
			},
		],
	},
};

export default nextConfig;
