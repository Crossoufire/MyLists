interface RequestOptions {
    [key: string]: any;
}


export class BaseClient {
    readonly resultsPerPage = 20;

    async call(url: string, method: "post" | "get" = "get", options: RequestOptions = {}) {
        try {
            const fetchOptions: RequestInit = {
                method: method.toUpperCase(),
                ...options,
            };

            const response = await fetch(url, fetchOptions);

            if (!response.ok) {
                return Promise.reject({
                    status: response.status,
                    description: response.statusText,
                });
            }

            return response;
        }
        catch (error: any) {
            return Promise.reject({
                status: 503,
                description: "Failed to fetch data from external API",
            });
        }
    }
}
