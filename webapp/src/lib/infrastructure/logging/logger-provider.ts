export const SENTRY_LOGGER_PROVIDER = "sentry" as const;

export const NON_SENTRY_LOGGER_PROVIDERS = ["console", "noop"] as const;

export const LOGGER_PROVIDERS = [
	SENTRY_LOGGER_PROVIDER,
	...NON_SENTRY_LOGGER_PROVIDERS,
] as const;

export type LoggerProvider = (typeof LOGGER_PROVIDERS)[number];
