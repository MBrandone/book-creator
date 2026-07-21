import * as Sentry from "@sentry/nextjs";
import type { LogAttributes, Logger } from "./logger";

export class SentryLogger implements Logger {
	private readonly context: LogAttributes;

	constructor(context: LogAttributes = {}) {
		this.context = context;
	}

	debug(message: string, attributes?: LogAttributes): void {
		Sentry.logger.debug(message, this.mergeAttributes(attributes));
	}

	info(message: string, attributes?: LogAttributes): void {
		Sentry.logger.info(message, this.mergeAttributes(attributes));
	}

	warn(message: string, attributes?: LogAttributes): void {
		Sentry.logger.warn(message, this.mergeAttributes(attributes));
	}

	error(message: string, attributes?: LogAttributes): void {
		Sentry.logger.error(message, this.mergeAttributes(attributes));
	}

	child(context: LogAttributes): Logger {
		return new SentryLogger({ ...this.context, ...context });
	}

	private mergeAttributes(attributes?: LogAttributes): LogAttributes {
		return { ...this.context, ...attributes };
	}
}

let browserLoggerInstance: Logger | null = null;

export function getBrowserLogger(): Logger {
	if (!browserLoggerInstance) {
		browserLoggerInstance = new SentryLogger();
	}
	return browserLoggerInstance;
}
