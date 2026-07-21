import { env } from "@/config/env";
import { ConsoleLogger } from "./console-logger";
import type { Logger } from "./logger";
import { NoopLogger } from "./noop-logger";
import { SentryLogger } from "./sentry-logger";

let loggerInstance: Logger | null = null;

export function getLogger(): Logger {
	if (!loggerInstance) {
		loggerInstance = createLogger();
	}
	return loggerInstance;
}

function createLogger(): Logger {
	switch (env.LOGS_PROVIDER) {
		case "sentry":
			return new SentryLogger();
		case "noop":
			return new NoopLogger();
		case "console":
			return new ConsoleLogger();
	}
}
