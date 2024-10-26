import {APIError} from "@/api/apiError";
import {ApiResponse, User} from "@/utils/types.tsx";


// Base API url from flask backend
const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;


interface RequestData {
    method: string;
    url: string;
    body?: any;
    query?: Record<string, any>;
    headers?: Record<string, string>;
    removeContentType?: boolean;
}


class ApiClient {
    readonly base_url: string;

    constructor() {
        this.base_url = `${BASE_API_URL}/api`;
    }

    isAuthenticated(): boolean {
        return this.getAccessToken() !== null;
    }

    setAccessToken(token: string) {
        localStorage.setItem("accessToken", token);
    }

    getAccessToken() {
        return localStorage.getItem("accessToken");
    }

    removeAccessToken() {
        localStorage.removeItem("accessToken");
    }

    filterParams(queryData: Record<string, any> | undefined): string {
        const filteredParams = Object.entries(queryData || {})
            .filter(([_, value]) => value !== undefined && value !== "null" && value !== null)
            .reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
            }, {} as Record<string, any>);

        let queryArgs = new URLSearchParams(filteredParams).toString();
        if (queryArgs !== "") {
            queryArgs = `?${queryArgs}`;
        }

        return queryArgs;
    }

    async request(data: RequestData): Promise<ApiResponse> {
        let response = await this.requestInternal(data);

        if ((response.status === 401 || (response.status === 403 && this.isAuthenticated())) && data.url !== "/tokens") {
            let beforeRenewAccessToken = this.getAccessToken();
            const refreshResponse = await this.put("/tokens", {
                access_token: this.getAccessToken(),
            });

            if (refreshResponse.ok) {
                this.setAccessToken(refreshResponse.body?.access_token);
                response = await this.requestInternal(data);
            }

            // Check no another call was made just before that changed the access and refresh tokens
            if (!refreshResponse.ok && (beforeRenewAccessToken !== this.getAccessToken())) {
                response = await this.requestInternal(data);
            }
        }

        return response;
    }

    async requestInternal(data: RequestData): Promise<ApiResponse> {
        const queryArgs = this.filterParams(data.query || {});
        let response;

        try {
            let body: RequestInit = {
                method: data.method,
                headers: {
                    "Authorization": `Bearer ${this.getAccessToken()}`,
                    ...(data.removeContentType ? {} : {"Content-Type": "application/json"}),
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

    async login(username: string, password: string): Promise<ApiResponse> {
        const utf8Bytes = new TextEncoder().encode(`${username}:${password}`);
        const base64Encoded = btoa(String.fromCharCode(...utf8Bytes));

        const response = await this.post("/tokens", JSON.stringify({username, password}), {
            headers: {Authorization: `Basic ${base64Encoded}`},
        });

        if (!response.ok) {
            throw new APIError(response.status, response.body.message, response.body.description);
        }

        return response;
    };

    async oAuth2Login(provider: string, data: any): Promise<ApiResponse> {
        const response = await this.post(`/tokens/oauth2/${provider}`, data);
        if (!response.ok) {
            throw new APIError(response.status, response.body.message, response.body.description);
        }
        return response;
    };

    async logout() {
        await this.delete("/tokens");
    };

    async register(data: any): Promise<ApiResponse> {
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

    async fetchCurrentUser(): Promise<null | Record<string, any>> {
        if (api.isAuthenticated()) {
            const response = await this.get("/current_user");
            return response.ok ? response.body as User : null;
        }
        return null;
    };

    async get(url: string, query?: Record<string, any>, obj?: Record<string, any>): Promise<ApiResponse> {
        return this.request({method: "GET", url, query, ...obj});
    };

    async post(url: string, body?: any, obj?: Record<string, any>): Promise<ApiResponse> {
        return this.request({method: "POST", url, body, ...obj});
    };

    async put(url: string, body?: any, obj?: Record<string, any>): Promise<ApiResponse> {
        return this.request({method: "PUT", url, body, ...obj});
    }

    async delete(url: string, obj?: Record<string, any>): Promise<ApiResponse> {
        return this.request({method: "DELETE", url, ...obj});
    }
}


export const api = new ApiClient();
