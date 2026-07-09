import type { RetryStrategy } from "../retry-strategy";

export class NoRetryStrategy implements RetryStrategy {
	async execute<T>(fn: () => Promise<T>): Promise<T> {
		return await fn();
	}
}
