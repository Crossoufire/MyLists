import {BaseClient} from "@/lib/server/domain/media-providers/clients/base.client";


export class IgdbClient extends BaseClient {
    private readonly apiKey = process.env.IGDB_API_KEY;
    private readonly secretId = process.env.SECRET_IGDB;
    private readonly clientId = process.env.CLIENT_IGDB;
    private readonly baseUrl = "https://api.igdb.com/v4/games";
    private readonly headers = {
        "Client-ID": this.clientId,
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
    };

    async search(query: string, page: number = 1) {
        const data = (
            `fields id, name, cover.image_id, first_release_date; limit 10; 
            offset ${(page - 1) * this.resultsPerPage}; search "${query}";`
        )
        const response = await this.call(this.baseUrl, "post", { headers: this.headers, body: JSON.stringify(data) })
        return response.json();
    }

    async getDetails(apiId: string) {
        const data = (
            `fields name, cover.image_id, game_engines.name, game_modes.name, platforms.name, genres.name, 
            player_perspectives.name, total_rating, total_rating_count, first_release_date, 
            involved_companies.company.name, involved_companies.developer, involved_companies.publisher, 
            summary, themes.name, url; where id=${apiId};`
        )

        const response = await this.call(`${this.baseUrl}/${apiId}`, "post", {
            headers: this.headers,
            body: JSON.stringify(data),
        });

        return response.json();
    }

    async updateToken() {
        const url = `https://id.twitch.tv/oauth2/token?client_id=${this.clientId}&client_secret=${this.secretId}&grant_type=client_credentials`
        const response = await this.call(url)
        return response.json();
    }
}
