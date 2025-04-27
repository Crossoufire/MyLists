import {BaseClient} from "@/lib/server/media-providers/clients/base.client";


export class GbooksClient extends BaseClient {
    static readonly baseUrl = "";

    async search(query: string, page: number = 1) {
        const offset = (page - 1) * this.resultsPerPage;
        const url = `${GbooksClient.baseUrl}?q=${query}&startIndex=${offset}`;
        return this.call(url);
    }

    async getDetails(apiId: string) {
        const url = `${GbooksClient.baseUrl}/${apiId}`;
        return this.call(url);
    }
}
