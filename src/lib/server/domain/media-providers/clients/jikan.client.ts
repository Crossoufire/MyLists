import {BaseClient} from "@/lib/server/domain/media-providers/clients/base.client";


export class JikanClient extends BaseClient {
    private readonly baseUrl = "https://api.jikan.moe/v4/manga";

    async search(query: string, page: number = 1) {
        const url = `${this.baseUrl}?q=${query}&page=${page}`;
        const response = await this.call(url)
        return response.text;
    }

    async getDetails(apiId: string) {
        const response = await this.call(`${this.baseUrl}/${apiId}/full`)
        return response.text
    }
}
