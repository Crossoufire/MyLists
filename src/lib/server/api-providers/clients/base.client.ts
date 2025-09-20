import {notFound} from "@tanstack/react-router";
import {FormattedError} from "@/lib/server/utils/error-classes";
import {RateLimiterAbstract, RateLimiterRes} from "rate-limiter-flexible";


export class BaseClient {
    private consumeKey: string;
    readonly resultsPerPage = 20;
    private limiter: RateLimiterAbstract;

    constructor(limiterInstance: RateLimiterAbstract, consumeKey: string) {
        this.limiter = limiterInstance;
        this.consumeKey = consumeKey;
    }

    async call(url: string, method: "post" | "get" = "get", options: RequestInit = {}) {
        const fetchOperation = async () => {
            const fetchOptions: RequestInit = {
                method: method.toUpperCase(),
                ...options,
            };

            const response = await fetch(url, fetchOptions);
            if (!response.ok) {
                let errorBody = response.statusText;

                try {
                    const text = await response.text();
                    errorBody = text || response.statusText;
                }
                catch {
                    // Intentionally left empty. Failed to read response body, so falling back to statusText.
                }

                if (response.status === 404) {
                    throw notFound();
                }

                const error = new Error(`API Error: ${response.status} ${errorBody}`);
                (error as any).status = response.status;

                throw error;
            }

            return response;
        };

        try {
            await this.limiter.consume(this.consumeKey);
            return await fetchOperation();
        }
        catch (err) {
            if (err instanceof Error) {
                console.error(`Rate limiter encountered an unexpected error for key "${this.consumeKey}":`, err);
                throw err;
            }
            else {
                const typedRejRes = err as RateLimiterRes;
                console.warn(
                    `Rate limit exceeded for key "${this.consumeKey}". 
                    Request blocked. Available in ${typedRejRes.msBeforeNext} ms.`
                );
                const error = new FormattedError("Rate limit exceeded. Please try again later.");
                (error as any).status = 429;
                (error as any).isRateLimitError = true;
                (error as any).msBeforeNext = typedRejRes.msBeforeNext;

                throw error;
            }
        }
    }
}
