export interface RetryStrategy {
  execute<T>(fn: () => Promise<T>): Promise<T>;
}
