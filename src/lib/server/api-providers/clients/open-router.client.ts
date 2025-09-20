import z from "zod";
import {serverEnv} from "@/env/server";
import {RateLimiterAbstract} from "rate-limiter-flexible";
import {createRateLimiter} from "@/lib/server/core/rate-limiter";
import {BaseClient} from "@/lib/server/api-providers/clients/base.client";
import {OpenRouterResponse} from "@/lib/types/provider.types";


export class OpenRouterClient extends BaseClient {
    private static readonly consumeKey = "open-router-API";
    private readonly baseUrl = "https://openrouter.ai/api/v1";
    private static readonly throttleOptions = { points: 20, duration: 1, keyPrefix: "openRouterAPI" };

    constructor(limiter: RateLimiterAbstract, consumeKey: string) {
        super(limiter, consumeKey);
    }

    public static async create() {
        const openRouterLimiter = await createRateLimiter(OpenRouterClient.throttleOptions);
        return new OpenRouterClient(openRouterLimiter, OpenRouterClient.consumeKey);
    }

    async llmBookGenresCall(content: string, schema: z.Schema): Promise<OpenRouterResponse> {
        const response = await this.call(`${this.baseUrl}/chat/completions`, "post", {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${serverEnv.OPEN_ROUTER_API_KEY}`,
            },
            body: JSON.stringify({
                model: serverEnv.OPEN_ROUTER_MODEL_ID,
                messages: [{ role: "user", content: content }],
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        strict: true,
                        name: "bookGenres",
                        schema: z.toJSONSchema(schema),
                    }
                }
            }),
        });
        return response.json();
    }
}
