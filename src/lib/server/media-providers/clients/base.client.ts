import {notFound} from "@tanstack/react-router";
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
                }

                if (response.status === 404) throw notFound();

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
        catch (rejRes: any) {
            if (rejRes instanceof Error) {
                console.error(`Rate limiter encountered an unexpected error for key "${this.consumeKey}":`, rejRes);
                throw rejRes;
            }
            else {
                const typedRejRes = rejRes as RateLimiterRes;
                console.warn(
                    `Rate limit exceeded for key "${this.consumeKey}". 
                    Request blocked. Available in ${typedRejRes.msBeforeNext} ms.`
                );
                const error = new Error(`Rate limit exceeded for ${this.consumeKey}. Please try again later.`);
                (error as any).status = 429;
                (error as any).msBeforeNext = typedRejRes.msBeforeNext;
                (error as any).isRateLimitError = true;

                throw error;
            }
        }
    }
}
