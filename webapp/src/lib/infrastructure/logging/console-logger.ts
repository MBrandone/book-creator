import type { LogAttributes, Logger } from "./logger";

export class ConsoleLogger implements Logger {
	private readonly context: LogAttributes;

	constructor(context: LogAttributes = {}) {
		this.context = context;
	}

	debug(message: string, attributes?: LogAttributes): void {
		console.debug(this.formatMessage("DEBUG", message, attributes));
	}

	info(message: string, attributes?: LogAttributes): void {
		console.info(this.formatMessage("INFO", message, attributes));
	}

	warn(message: string, attributes?: LogAttributes): void {
		console.warn(this.formatMessage("WARN", message, attributes));
	}

	error(message: string, attributes?: LogAttributes): void {
		console.error(this.formatMessage("ERROR", message, attributes));
	}

	child(context: LogAttributes): Logger {
		return new ConsoleLogger({ ...this.context, ...context });
	}

	private formatMessage(
		level: string,
		message: string,
		attributes?: LogAttributes
	): string {
		const merged = { ...this.context, ...attributes };
		const attributesPart =
			Object.keys(merged).length > 0 ? ` ${JSON.stringify(merged)}` : "";
		return `[${level}] ${message}${attributesPart}`;
	}
}
