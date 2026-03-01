import z from "zod";
import {serverEnv} from "@/env/server";
import {LLMResponse} from "@/lib/types/provider.types";
import {RateLimiterAbstract} from "rate-limiter-flexible";
import {createRateLimiter} from "@/lib/server/core/rate-limiter";
import {BaseApi} from "@/lib/server/api-providers/api/base.api";


export class LlmApi extends BaseApi {
    private static readonly consumeKey = "llm-API";
    private readonly baseUrl = serverEnv.LLM_BASE_URL;
    private static readonly throttleOptions = { points: 5, duration: 1, keyPrefix: "llmAPI" };

    constructor(limiter: RateLimiterAbstract, consumeKey: string) {
        super(limiter, consumeKey);
    }

    public static async create() {
        const llmLimiter = await createRateLimiter(LlmApi.throttleOptions);
        return new LlmApi(llmLimiter, LlmApi.consumeKey);
    }

    async llmBookGenresCall(content: string, schema: z.Schema): Promise<LLMResponse> {
        const response = await this.call(`${this.baseUrl}/chat/completions`, "post", {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${serverEnv.LLM_API_KEY}`,
            },
            body: JSON.stringify({
                model: serverEnv.LLM_MODEL_ID,
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
