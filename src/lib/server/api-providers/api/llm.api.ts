import z from "zod";
import {serverEnv} from "@/env/server";
import {RateLimiterAbstract} from "rate-limiter-flexible";
import {BaseApi} from "@/lib/server/api-providers/api/base.api";
import {createRateLimiter} from "@/lib/server/core/rate-limiter";
import {LLMCompletionResponse, LLMEmbeddingResponse} from "@/lib/types/provider.types";


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

    async llmBookGenresCall(content: string, schema: z.Schema): Promise<LLMCompletionResponse> {
        const response = await this.call(`${this.baseUrl}/chat/completions`, "post", {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${serverEnv.LLM_API_KEY}`,
            },
            body: JSON.stringify({
                model: serverEnv.LLM_BOOK_MODEL_ID,
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

    async llmEmbeddingCall(input: string | string[]): Promise<LLMEmbeddingResponse> {
        const response = await this.call(`${this.baseUrl}/embeddings`, "post", {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${serverEnv.LLM_API_KEY}`,
            },
            body: JSON.stringify({ input, model: serverEnv.LLM_EMBED_MODEL_ID }),
        });

        return response.json();
    }
}
