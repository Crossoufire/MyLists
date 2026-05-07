import {notFound} from "@tanstack/react-router";
import {FormattedError} from "@/lib/utils/error-classes";
import {RateLimiterAbstract, RateLimiterQueue} from "rate-limiter-flexible";


export class BaseApi {
    readonly resultsPerPage = 20;
    private queues: RateLimiterQueue[];
    private readonly consumeKey: string;
    private static readonly maxAttempts = 3;

    constructor(limiterInstances: RateLimiterAbstract | RateLimiterAbstract[], consumeKey: string) {
        this.consumeKey = consumeKey;
        const limiters = Array.isArray(limiterInstances) ? limiterInstances : [limiterInstances];
        this.queues = limiters.map((limiter) => new RateLimiterQueue(limiter, { maxQueueSize: 200 }));
    }

    async call(url: string, method: "post" | "get" = "get", options: RequestInit = {}) {
        try {
            for (let attempt = 1; attempt <= BaseApi.maxAttempts; attempt += 1) {
                await Promise.all(this.queues.map((queue) => queue.removeTokens(1, this.consumeKey)));

                const response = await fetch(url, {
                    method: method.toUpperCase(),
                    signal: AbortSignal.timeout(100_000),
                    ...options,
                });

                if (response.ok) {
                    return response;
                }

                if (this._shouldRetry(response.status) && attempt < BaseApi.maxAttempts) {
                    await this._waitBeforeRetry(response, attempt);
                    continue;
                }

                await this._handleResponseError(response);
            }

            throw new FormattedError("API currently unavailable. Please try again later.");
        }
        catch (err) {
            if (err instanceof DOMException && err.name === "TimeoutError") {
                throw new FormattedError("Request timed out. API probably down. Please try again later.");
            }
            throw err;
        }
    }

    private _shouldRetry(status: number) {
        return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
    }

    private async _waitBeforeRetry(res: Response, attempt: number) {
        const fallbackDelayMs = 500 * attempt;
        const retryAfterSecs = this._getRetryAfterSeconds(res);
        const delayMs = retryAfterSecs ? retryAfterSecs * 1000 : fallbackDelayMs;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    private _getRetryAfterSeconds(res: Response) {
        const retryAfter = res.headers.get("Retry-After");
        if (!retryAfter) return null;

        const seconds = Number(retryAfter);
        if (Number.isFinite(seconds) && seconds > 0) {
            return seconds;
        }

        const dateMs = Date.parse(retryAfter);
        if (Number.isFinite(dateMs)) {
            return Math.max(Math.ceil((dateMs - Date.now()) / 1000), 1);
        }

        return null;
    }

    private async _handleResponseError(res: Response) {
        switch (res.status) {
            case 404:
                throw notFound();
            case 429:
                throw new FormattedError("Too many requests. Please try again in a minute.");
            case 403:
                throw new FormattedError("API quota or access limit reached. Please try again later.");
            case 410:
                throw new FormattedError("Media no longer available on the API.");
            case 401:
                throw new FormattedError("API not accessible. Please try again later.");
            case 500:
            case 502:
            case 503:
            case 504:
                throw new FormattedError("API currently not accessible. Please try again later.");
            default: {
                throw new Error(`Unexpected Error: ${res.status}`);
            }
        }
    }
}
