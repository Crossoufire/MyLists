import {APIError} from "./apiError";


let api = null;


class ApiClient {
    constructor(base_api_url = "") {
        this.base_url = `${base_api_url}/api`;
    }

    isAuthenticated() {
        return this.getAccessToken() !== null;
    }

    setAccessToken(token) {
        localStorage.setItem("accessToken", token);
    }

    getAccessToken() {
        return localStorage.getItem("accessToken");
    }

    removeAccessToken() {
        localStorage.removeItem("accessToken");
    }

    filterParams(queryData) {
        const filteredParams = Object.entries(queryData || {})
            .filter(([_, value]) => value !== undefined && value !== "null" && value !== null)
            .reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
            }, {});

        let queryArgs = new URLSearchParams(filteredParams).toString();
        if (queryArgs !== "") {
            queryArgs = `?${queryArgs}`;
        }

        return queryArgs;
    }

    async request(data) {
        let response = await this.requestInternal(data);

        if ((response.status === 401 || (response.status === 403 && this.isAuthenticated())) && data.url !== "/tokens") {
            let beforeRenewAccessToken = this.getAccessToken();

            const refreshResponse = await this.put("/tokens", { access_token: this.getAccessToken() });
            if (refreshResponse.ok) {
                this.setAccessToken(refreshResponse.body.access_token);
                response = await this.requestInternal(data);
            }

            // Check no another call was made just before that changed the access and refresh tokens
            if (!refreshResponse.ok && (beforeRenewAccessToken !== this.getAccessToken())) {
                response = await this.requestInternal(data);
            }
        }

        return response;
    }

    async requestInternal(data) {
        const queryArgs = this.filterParams(data.query);

        let response;
        try {
            let body = {
                method: data.method,
                headers: {
                    "Authorization": `Bearer ${this.getAccessToken()}`,
                    ...(data.removeContentType ? {} : { "Content-Type": "application/json" }),
                    ...data.headers,
                },
                credentials: "include",
                body: data.body ? data.body instanceof FormData ? data.body : JSON.stringify(data.body) : null,
            };
            response = await fetch(this.base_url + data.url + queryArgs, body);
        }
        catch (error) {
            response = {
                ok: false,
                status: 500,
                json: async () => {
                    return {
                        code: 500,
                        message: "Internal Server Error",
                        description: error.toString(),
                    };
                }
            };
        }

        return {
            ok: response.ok,
            status: response.status,
            body: response.status === 204 ? null : await response.json(),
        };
    };

    async login(username, password) {
        const utf8Bytes = new TextEncoder().encode(`${username}:${password}`);
        const base64Encoded = btoa(String.fromCharCode(...utf8Bytes));

        const response = await this.post("/tokens", JSON.stringify({ username, password }), {
            headers: { Authorization: `Basic ${base64Encoded}` },
        });

        if (!response.ok) {
            throw new APIError(response.status, response.body.message, response.body.description);
        }

        return response;
    };

    async oAuth2Login(provider, data) {
        const response = await this.post(`/tokens/oauth2/${provider}`, data);
        if (!response.ok) {
            throw new APIError(response.status, response.body.message, response.body.description);
        }
        return response;
    };

    async logout() {
        await this.delete("/tokens");
    };

    async register(data) {
        const response = await this.post("/register_user", data);
        if (!response.ok) {
            throw new APIError(
                response.status,
                response.body.message,
                response.body.description,
                response.body?.errors,
            );
        }
        return response;
    };

    async fetchCurrentUser() {
        if (this.isAuthenticated()) {
            const response = await this.get("/current_user");
            return response.ok ? response.body : null;
        }
        return null;
    };

    async get(url, query, obj) {
        return this.request({ method: "GET", url, query, ...obj });
    };

    async post(url, body, obj) {
        return this.request({ method: "POST", url, body, ...obj });
    };

    async put(url, body, obj) {
        return this.request({ method: "PUT", url, body, ...obj });
    };

    async delete(url, obj) {
        return this.request({ method: "DELETE", url, ...obj });
    };
}


export const initApiClient = (baseApiUrl) => {
    api = new ApiClient(baseApiUrl);
};


export const getApiClient = () => {
    if (!api) {
        throw new Error("ApiClient has not been initialized. Please call initApiClient first.");
    }
    return api;
};
