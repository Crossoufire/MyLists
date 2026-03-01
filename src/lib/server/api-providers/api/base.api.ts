import {notFound} from "@tanstack/react-router";
import {FormattedError} from "@/lib/utils/error-classes";
import {RateLimiterAbstract, RateLimiterQueue} from "rate-limiter-flexible";


export class BaseApi {
    readonly resultsPerPage = 20;
    private queues: RateLimiterQueue[];
    private readonly consumeKey: string;

    constructor(limiterInstances: RateLimiterAbstract | RateLimiterAbstract[], consumeKey: string) {
        this.consumeKey = consumeKey;
        const limiters = Array.isArray(limiterInstances) ? limiterInstances : [limiterInstances];
        this.queues = limiters.map((limiter) => new RateLimiterQueue(limiter, { maxQueueSize: 200 }));
    }

    async call(url: string, method: "post" | "get" = "get", options: RequestInit = {}) {
        try {
            await Promise.all(this.queues.map((queue) => queue.removeTokens(1, this.consumeKey)));

            const response = await fetch(url, {
                method: method.toUpperCase(),
                signal: AbortSignal.timeout(100_000),
                ...options,
            });

            if (!response.ok) {
                await this._handleResponseError(response);
            }

            return response;
        }
        catch (err) {
            if (err instanceof DOMException && err.name === "TimeoutError") {
                throw new FormattedError("Request timed out. API probably down. Please try again later.");
            }
            if (err instanceof FormattedError) {
                throw err;
            }

            throw err;
        }
    }

    private async _handleResponseError(res: Response) {
        switch (res.status) {
            case 404:
                throw notFound();
            case 429: {
                // API-level rate limiting (bad rate limit on my part)
                const retryAfter = res.headers.get("Retry-After");
                const retryAfterSecs = retryAfter ? Number(retryAfter) : 1;
                await new Promise((resolve) => setTimeout(resolve, retryAfterSecs * 1000))

                const waitMessage = retryAfter ? `Please wait ${retryAfter}s and try again.` : "Please try again later.";
                throw new FormattedError(`Too many requests. ${waitMessage}`);
            }
            case 410:
                throw new FormattedError("Media no longer available on the API.");
            case 401:
                throw new FormattedError("API not accessible. Please try again later.");
            case 500:
            case 502:
            case 503:
            case 504:
                throw new FormattedError("API currently down. Please try again later.");
            default: {
                throw new Error(`Unexpected Error: ${res.status}`);
            }
        }
    }
}
