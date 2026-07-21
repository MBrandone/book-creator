export type LogAttributes = Record<string, string | number | boolean>;

export interface Logger {
	debug(message: string, attributes?: LogAttributes): void;
	info(message: string, attributes?: LogAttributes): void;
	warn(message: string, attributes?: LogAttributes): void;
	error(message: string, attributes?: LogAttributes): void;
	child(context: LogAttributes): Logger;
}
