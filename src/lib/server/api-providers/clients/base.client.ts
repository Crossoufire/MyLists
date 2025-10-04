import {notFound} from "@tanstack/react-router";
import {FormattedError} from "@/lib/utils/error-classes";
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
        try {
            await this.limiter.consume(this.consumeKey);

            const response = await fetch(url, {
                method: method.toUpperCase(),
                signal: AbortSignal.timeout(8_000),
                ...options,
            });
            
            if (!response.ok) {
                this._handleErrorResponse(response);
            }

            return response;
        }
        catch (err) {
            if (err && typeof err === "object" && "msBeforeNext" in err) {
                const typedRejRes = err as RateLimiterRes;
                const waitTimeSec = Math.ceil(typedRejRes.msBeforeNext / 1000);
                throw new FormattedError(`Too many requests. Please wait ${waitTimeSec}s and try again.`);
            }
            if (err instanceof DOMException && err.name === "TimeoutError") {
                throw new FormattedError("Request timed out. API probably down. Please try again later.");
            }
            if (err instanceof FormattedError) {
                throw err;
            }

            throw err;
        }
    }

    private _handleErrorResponse(response: Response) {
        switch (response.status) {
            case 404:
                throw notFound();
            case 429: {
                // API-level rate limiting (bad rate limit on my part)
                const retryAfter = response.headers.get("Retry-After");
                const waitMessage = retryAfter ? `Please wait ${retryAfter}s and try again.` : "Please try again later.";
                throw new FormattedError(`Too many requests. ${waitMessage}`);
            }
            case 410:
                throw new FormattedError("This media is no longer available on the API.");
            case 500:
            case 502:
            case 503:
            case 504:
                throw new FormattedError("This API is currently down. Please try again later.");
            default: {
                throw new Error(`Unexpected error: ${response.status}`);
            }
        }
    }
}
