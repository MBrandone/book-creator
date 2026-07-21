import { RateLimitError } from "@/lib/infrastructure/http-request-retry-strategy/exponential-backoff/rate-limit-error";
import {
	DEFAULT_OPTIONS,
	type RetryOptions,
} from "@/lib/infrastructure/http-request-retry-strategy/exponential-backoff/retry-options";
import { getLogger } from "@/lib/infrastructure/logging/logger-factory";
import type { RetryStrategy } from "../retry-strategy";

export class ExponentialBackoffRetryStrategy implements RetryStrategy {
	private readonly options: Required<RetryOptions>;

	constructor(options: RetryOptions = {}) {
		this.options = { ...DEFAULT_OPTIONS, ...options };
	}

	async execute<T>(fn: () => Promise<T>): Promise<T> {
		let lastError: any;

		for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
			try {
				return await fn();
			} catch (error) {
				lastError = error;

				if (!this.isRateLimitError(error)) {
					throw error;
				}

				if (attempt === this.options.maxRetries) {
					getLogger().error(
						"Rate limit atteint après le nombre maximum de tentatives",
						{
							maxRetries: this.options.maxRetries,
						}
					);
					throw new RateLimitError(
						`Rate limit exceeded after ${this.options.maxRetries} retries: ${error instanceof Error ? error.message : "Unknown error"}`,
						this.extractRetryAfter(error)
					);
				}

				const retryAfter = this.extractRetryAfter(error);
				const delayMs = this.calculateBackoffDelay(attempt, retryAfter);

				getLogger().warn("Rate limit 429 détecté, retry planifié", {
					attempt: attempt + 1,
					maxAttempts: this.options.maxRetries + 1,
					delaySeconds: Math.round(delayMs / 1000),
				});

				await this.sleep(delayMs);
			}
		}

		throw lastError;
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private calculateBackoffDelay(
		attemptNumber: number,
		retryAfter?: number
	): number {
		if (retryAfter) {
			return Math.min(retryAfter * 1000, this.options.maxDelayMs);
		}

		const exponentialDelay =
			this.options.initialDelayMs *
			this.options.backoffMultiplier ** attemptNumber;
		const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);

		return Math.min(exponentialDelay + jitter, this.options.maxDelayMs);
	}

	private isRateLimitError(error: any): boolean {
		if (
			error?.status === 429 ||
			error?.statusCode === 429 ||
			error?.response?.status === 429
		) {
			return true;
		}

		const message = error?.message?.toLowerCase() || "";
		return (
			message.includes("rate limit") ||
			message.includes("429") ||
			message.includes("too many requests")
		);
	}

	private extractRetryAfter(error: any): number | undefined {
		if (error?.response?.headers?.["retry-after"]) {
			const retryAfter = parseInt(error.response.headers["retry-after"], 10);
			return Number.isNaN(retryAfter) ? undefined : retryAfter;
		}

		if (error?.headers?.["retry-after"]) {
			const retryAfter = parseInt(error.headers["retry-after"], 10);
			return Number.isNaN(retryAfter) ? undefined : retryAfter;
		}

		return undefined;
	}
}
