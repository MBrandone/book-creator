"use client";

import { useEffect } from "react";
import { getBrowserLogger } from "@/lib/infrastructure/logging/sentry-logger";

export function ServiceWorkerRegistration() {
	useEffect(() => {
		if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
			navigator.serviceWorker
				.register("/sw.js")
				.then((registration) => {
					getBrowserLogger().info("Service Worker enregistré avec succès", {
						scope: registration.scope,
					});
				})
				.catch((error) => {
					getBrowserLogger().error(
						"Échec de l'enregistrement du Service Worker",
						{ error: String(error) }
					);
				});
		}
	}, []);

	return null;
}
