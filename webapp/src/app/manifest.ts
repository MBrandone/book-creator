import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "Book Creator",
		short_name: "Book Creator",
		description: "Créez des livres illustrés pour enfants avec l'IA",
		start_url: "/",
		display: "standalone",
		background_color: "#ffffff",
		theme_color: "#000000",
		orientation: "portrait",
		lang: "fr",
		icons: [
			{
				src: "/icons/icon-192.png",
				sizes: "192x192",
				type: "image/png",
				purpose: "any",
			},
			{
				src: "/icons/icon-512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "any",
			},
			{
				src: "/icons/icon-192-maskable.png",
				sizes: "192x192",
				type: "image/png",
				purpose: "maskable",
			},
		],
	};
}
