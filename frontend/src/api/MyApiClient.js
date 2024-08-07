

// Base API url from flask backend
const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;


class MyApiClient {
    constructor() {
        if (!MyApiClient.instance) {
            this.base_url = `${BASE_API_URL}/api`;
            MyApiClient.instance = this;
        }
        return MyApiClient.instance;
    }

    isAuthenticated() {
        return localStorage.getItem("accessToken") !== null;
    }

    filterParams(queryData) {
        const filteredParams = Object.entries(queryData || {})
            .filter(([_, value]) => value !== undefined && value !== "null" && value !== null)
            .reduce((obj, [key, value]) => { obj[key] = value; return obj; }, {});

        let queryArgs = new URLSearchParams(filteredParams).toString();
        if (queryArgs !== "") {
            queryArgs = `?${queryArgs}`;
        }

        return queryArgs;
    }

    async request(data) {
        let response = await this.requestInternal(data);

        if (response.status === 401 && data.url !== "/tokens") {
            let beforeRenewAccessToken = localStorage.getItem("accessToken");
            const refreshResponse = await this.put("/tokens", {
                access_token: localStorage.getItem("accessToken"),
            });

            if (refreshResponse.ok) {
                localStorage.setItem("accessToken", refreshResponse.body.access_token);
                response = await this.requestInternal(data);
            }

            // Check no another call was made just before that changed the access and refresh tokens
            if (!refreshResponse.ok && (beforeRenewAccessToken !== localStorage.getItem("accessToken"))) {
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
                    "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
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
        }
    };

    async adminLogin(password) {
        return await this.post("/admin/auth", {password}, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            }
        });
    };

    async login(usernameOrProvider, passwordOrProviderData, oAuth2) {
        let response;

        if (oAuth2) {
            response = await this.post(`/tokens/oauth2/${usernameOrProvider}`, passwordOrProviderData);
        }
        else {
            const utf8Bytes = new TextEncoder().encode(`${usernameOrProvider}:${passwordOrProviderData}`);
            response = await this.post("/tokens",
                JSON.stringify({ usernameOrProvider, passwordOrProviderData }), {
                headers: { Authorization:  `Basic ${btoa(String.fromCharCode(...utf8Bytes))}` }
            });
        }

        if (response.ok) {
            localStorage.setItem("accessToken", response.body.access_token);
        }

        return response;
    };

    async logout() {
        await this.delete("/tokens");
        localStorage.removeItem("accessToken");
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


class UserClient {
    constructor(currentUser = null) {
        this.currentUser = currentUser;
        this.subscribers = [];
    }

    setCurrentUser(newData) {
        this.currentUser = newData;
        this.notifySubscribers();
    }

    notifySubscribers() {
        this.subscribers.forEach(sub => sub(this.currentUser));
    }

    subscribe(callbackFunction) {
        this.subscribers.push(callbackFunction);
    }

    unsubscribe(callbackFunction) {
        this.subscribers = this.subscribers.filter(sub => sub !== callbackFunction);
    }

    static async initialize() {
        let currentUser = null;

        if (api.isAuthenticated()) {
			const response = await api.get("/current_user");
			currentUser = response.ok ? response.body : null;
        }

        return new UserClient(currentUser);
    }

    async login(usernameOrProvider, passwordOrProviderData, oAuth2 = false) {
        const logging = await api.login(usernameOrProvider, passwordOrProviderData, oAuth2);

        if (logging.ok) {
            const response = await api.get("/current_user");
            this.setCurrentUser(response.ok ? response.body : null);
        }

        return logging;
    }

    async logout() {
        await api.logout();
        this.setCurrentUser(null);
    }
}


const api = new MyApiClient();


let userClient = null;


export async function initializeUserClient() {
    if (!userClient) {
        userClient = await UserClient.initialize();
    }
}


export { api, userClient };
