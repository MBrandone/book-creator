import { env } from "@/config/env";
import { ConsoleLogger } from "./console-logger";
import type { Logger } from "./logger";
import type { LoggerProvider } from "./logger-provider";
import { NoopLogger } from "./noop-logger";
import { SentryLogger } from "./sentry-logger";

const providers = {
	sentry: () => new SentryLogger(),
	console: () => new ConsoleLogger(),
	noop: () => new NoopLogger(),
} satisfies Record<LoggerProvider, () => Logger>;

let cachedInstance: Logger | null = null;

export function getLogger(): Logger {
	if (cachedInstance) {
		return cachedInstance;
	}

	cachedInstance = providers[env.LOGS_PROVIDER]();
	return cachedInstance;
}
