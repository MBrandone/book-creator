import type { LogAttributes, Logger } from "./logger";

export class NoopLogger implements Logger {
	debug(_message: string, _attributes?: LogAttributes): void {}
	info(_message: string, _attributes?: LogAttributes): void {}
	warn(_message: string, _attributes?: LogAttributes): void {}
	error(_message: string, _attributes?: LogAttributes): void {}

	child(_context: LogAttributes): Logger {
		return this;
	}
}
