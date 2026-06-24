/**
 * Utilitaires pour gérer les retry et backoff exponentiel pour les appels Replicate
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
}

export class RateLimitError extends Error {
  constructor(message: string, public retryAfter?: number) {
    super(message);
    this.name = 'RateLimitError';
  }
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 5,
  initialDelayMs: 1000, // 1 seconde
  maxDelayMs: 60000, // 60 secondes
  backoffMultiplier: 2,
};

/**
 * Attend pendant un délai spécifié
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calcule le délai de backoff exponentiel
 */
function calculateBackoffDelay(
  attemptNumber: number,
  options: Required<RetryOptions>,
  retryAfter?: number
): number {
  if (retryAfter) {
    // Si l'API fournit un Retry-After, l'utiliser
    return Math.min(retryAfter * 1000, options.maxDelayMs);
  }

  // Calcul du backoff exponentiel: initialDelay * (multiplier ^ attemptNumber)
  const exponentialDelay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attemptNumber);
  
  // Ajouter un jitter aléatoire (±25%) pour éviter les thundering herds
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
  
  return Math.min(exponentialDelay + jitter, options.maxDelayMs);
}

/**
 * Vérifie si une erreur est une erreur 429 (rate limit)
 */
function isRateLimitError(error: any): boolean {
  // Vérifier différents formats d'erreur possibles
  if (error?.status === 429 || error?.statusCode === 429) {
    return true;
  }
  
  if (error?.response?.status === 429) {
    return true;
  }
  
  const message = error?.message?.toLowerCase() || '';
  return message.includes('rate limit') || 
         message.includes('429') || 
         message.includes('too many requests');
}

/**
 * Extrait la valeur Retry-After de l'erreur si disponible
 */
function extractRetryAfter(error: any): number | undefined {
  // Retry-After peut être en secondes
  if (error?.response?.headers?.['retry-after']) {
    const retryAfter = parseInt(error.response.headers['retry-after'], 10);
    return isNaN(retryAfter) ? undefined : retryAfter;
  }
  
  if (error?.headers?.['retry-after']) {
    const retryAfter = parseInt(error.headers['retry-after'], 10);
    return isNaN(retryAfter) ? undefined : retryAfter;
  }
  
  return undefined;
}

/**
 * Exécute une fonction avec retry et backoff exponentiel en cas d'erreur 429
 * 
 * @param fn - La fonction à exécuter
 * @param options - Options de configuration du retry
 * @returns Le résultat de la fonction
 * @throws L'erreur finale si tous les retries échouent
 */
export async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts: Required<RetryOptions> = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      // Première tentative ou retry
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Vérifier si c'est une erreur 429
      if (!isRateLimitError(error)) {
        // Si ce n'est pas une erreur de rate limit, la propager immédiatement
        throw error;
      }
      
      // Si c'est le dernier retry, propager l'erreur
      if (attempt === opts.maxRetries) {
        console.error(`❌ Rate limit atteint après ${opts.maxRetries} tentatives`);
        throw new RateLimitError(
          `Rate limit exceeded after ${opts.maxRetries} retries: ${error instanceof Error ? error.message : 'Unknown error'}`,
          extractRetryAfter(error)
        );
      }
      
      // Calculer le délai de backoff
      const retryAfter = extractRetryAfter(error);
      const delayMs = calculateBackoffDelay(attempt, opts, retryAfter);
      
      console.warn(
        `⚠️ Rate limit 429 détecté (tentative ${attempt + 1}/${opts.maxRetries + 1}). ` +
        `Retry dans ${Math.round(delayMs / 1000)}s...`
      );
      
      // Attendre avant de réessayer
      await sleep(delayMs);
    }
  }
  
  // Ne devrait jamais arriver ici, mais pour la sécurité du typage
  throw lastError;
}
