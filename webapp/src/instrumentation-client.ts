// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

export function register() {
	Sentry.init({
		dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
		enableLogs: true,
		tracesSampleRate: 1.0,
	});
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
