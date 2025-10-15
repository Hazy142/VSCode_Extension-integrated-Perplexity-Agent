// src/services/errors.ts

/**
 * Abstrakte Basisklasse für alle anwendungsspezifischen Fehler.
 * Stellt sicher, dass alle Fehler einen Code und ein isRetryable-Flag haben.
 */
export abstract class PerplexityError extends Error {
    abstract code: string;
    abstract isRetryable: boolean;

    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

/**
 * Wird ausgelöst, wenn die API-Ratenbegrenzung erreicht ist.
 * Dieser Fehler ist typischerweise wiederholbar.
 */
export class RateLimitError extends PerplexityError {
    code = 'RATE_LIMIT_ERROR';
    isRetryable = true;

    constructor(message: string = 'API rate limit exceeded. Please try again later.') {
        super(message);
    }
}

/**
 * Wird bei allgemeinen API-Fehlern ausgelöst (z. B. ungültige Anfrage, Serverfehler).
 * Standardmäßig nicht wiederholbar, es sei denn, es handelt sich um einen 5xx-Fehler.
 */
export class APIError extends PerplexityError {
    code = 'API_ERROR';
    isRetryable: boolean;

    constructor(message: string, isRetryable: boolean = false) {
        super(message);
        this.isRetryable = isRetryable;
    }
}

/**
 * Wird bei Netzwerkproblemen ausgelöst (z. B. keine Verbindung, DNS-Fehler).
 * Diese Fehler sind typischerweise wiederholbar.
 */
export class NetworkError extends PerplexityError {
    code = 'NETWORK_ERROR';
    isRetryable = true;

    constructor(message: string = 'A network error occurred. Please check your connection.') {
        super(message);
    }
}
