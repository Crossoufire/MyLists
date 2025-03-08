import {APIError} from "./apiError";


let api = null;


class ApiClient {
    constructor(base_api_url = "") {
        this.baseUrl = `${base_api_url}/api`;
    }

    // --- Token-related methods ------------------------------------------------------------------

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

    // --- Utility Methods ------------------------------------------------------------------------

    filterParams(queryData) {
        if (!queryData) return "";

        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(queryData)) {
            if (value !== undefined && value !== null && value !== "null") {
                // noinspection JSCheckFunctionSignatures
                params.append(key, value);
            }
        }

        const queryString = params.toString();
        return queryString ? `?${queryString}` : "";
    }

    async refreshToken() {
        const currentToken = this.getAccessToken();

        // Refresh token via PUT request to "/tokens"
        const response = await this.put("/tokens", { access_token: currentToken });
        if (response.ok) {
            this.setAccessToken(response.body.access_token);
            return true;
        }

        // If token changed because of another concurrent refresh, assume success
        return currentToken !== this.getAccessToken();
    }

    // --- Core Request Methods -------------------------------------------------------------------

    async request(data) {
        // Make initial request
        let response = await this.requestInternal(data);

        // If response is auth error, and not already trying to refresh token, then try token refresh
        const needTokenRefresh = (response.status === 401 || (response.status === 403 && this.isAuthenticated())) && data.url !== "/tokens";
        if (needTokenRefresh) {
            const oldToken = this.getAccessToken();
            const refreshSuccessful = await this.refreshToken();

            // Only redo request if token was refreshed (or updated externally) to avoid infinite loop
            if (refreshSuccessful && oldToken !== this.getAccessToken()) {
                response = await this.requestInternal(data);
            }
        }

        return response;
    }

    async requestInternal({ url, method, query, body, headers = {}, removeContentType = false, ...options }) {
        const accessToken = this.getAccessToken();
        const queryArgs = this.filterParams(query);

        // Build and merge headers
        const mergedHeaders = {
            Authorization: `Bearer ${accessToken}`,
            ...(removeContentType ? {} : { "Content-Type": "application/json" }),
            ...headers,
        };

        // Prepare request body
        const reqBody = ((body === undefined) || (body === null)) ? null : body instanceof FormData ? body : JSON.stringify(body);

        try {
            const response = await fetch(this.baseUrl + url + queryArgs, {
                method,
                headers: mergedHeaders,
                credentials: "include",
                body: reqBody,
                ...options,
            });

            return {
                ok: response.ok,
                status: response.status,
                body: response.status === 204 ? null : await response.json(),
            };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                body: {
                    code: 500,
                    description: error.toString(),
                    message: "Internal Server Error",
                }
            };
        }
    };

    // --- Convenience Methods -------------------------------------------------------------------

    async login(username, password) {
        // Create Base64-encoded string for Basic Auth
        const utf8Bytes = new TextEncoder().encode(`${username}:${password}`);
        const base64Encoded = btoa(String.fromCharCode(...utf8Bytes));

        const response = await this.post("/tokens", { username, password }, {
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

    async get(url, query = "", options = {}) {
        return this.request({ method: "GET", url, query, ...options });
    }

    async post(url, body, options = {}) {
        return this.request({ method: "POST", url, body, ...options });
    }

    async put(url, body, options = {}) {
        return this.request({ method: "PUT", url, body, ...options });
    }

    async delete(url, options = {}) {
        return this.request({ method: "DELETE", url, ...options });
    }
}


export const initApiClient = (baseApiUrl) => {
    api = new ApiClient(baseApiUrl);
};


export const getApiClient = () => {
    if (!api) {
        throw new Error("`ApiClient` has not been initialized. Please call `initApiClient` first.");
    }
    return api;
};
