import {BaseClient} from "@/lib/server/media-providers/clients/base.client";


export class GbooksClient extends BaseClient {
    private readonly baseUrl = "";

    async search(query: string, page: number = 1) {
        const offset = (page - 1) * this.resultsPerPage;
        const url = `${this.baseUrl}?q=${query}&startIndex=${offset}`;
        return this.call(url);
    }

    async getDetails(apiId: string) {
        const url = `${this.baseUrl}/${apiId}`;
        return this.call(url);
    }
}
