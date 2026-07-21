import * as Sentry from "@sentry/nextjs";

export async function register() {
	if (process.env.NEXT_RUNTIME === "nodejs") {
		Sentry.init({
			dsn: process.env.SENTRY_DSN,
			enableLogs: true,
			tracesSampleRate: 1.0,
		});
	}
}

export const onRequestError = Sentry.captureRequestError;
