
// Base API url from flask app
const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;


export class MyApiClient {
	constructor() {
		this.base_url =  `${BASE_API_URL}/api`;
	}
	
	isAuthenticated() {
		return localStorage.getItem("accessToken") !== null;
	}
	
	async request(data) {
		let response = await this.requestInternal(data);

		if (response.status === 401 && data.url !== "/tokens") {
			const refreshResponse = await this.put("/tokens", {
				access_token: localStorage.getItem("accessToken")
			});

			if (refreshResponse.ok) {
				localStorage.setItem("accessToken", refreshResponse.body.access_token);
				response = await this.requestInternal(data);
			}
		}

		return response;
	}
	
	async requestInternal(data) {
		const filteredParams = Object.entries(data.query || {})
			.filter(([_, value]) => value !== undefined && value !== "null" && value !== null)
			.reduce((obj, [key, value]) => {
				obj[key] = value;
				return obj;
			}, {});

		let query = new URLSearchParams(filteredParams).toString();
		if (query !== "") {
			query = "?" + query;
		}

		let response;
		try {
			let body = {
				method: data.method,
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
					...data.headers,
				},
				credentials: "include",
				body: data.body ? JSON.stringify(data.body) : null,
			}
			response = await fetch(this.base_url + data.url + query, body);
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
			body: response.status !== 204 ? await response.json() : null,
		}
	}

	async adminLogin(password) {
		return await this.post("/admin/auth", {password}, {
			headers: {
				Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
			}
		});
	}

	async login(usernameOrProvider, passwordOrProviderData, oAuth2) {
		let response;

		if (oAuth2) {
			response = await this.post(`/tokens/oauth2/${usernameOrProvider}`, passwordOrProviderData);
		}
		else {
			response = await this.post("/tokens", JSON.stringify({ usernameOrProvider, passwordOrProviderData }), {
				headers: {
					Authorization:  `Basic ${window.btoa(`${usernameOrProvider}:${passwordOrProviderData}`)}`
				}
			});
		}

		if (response.ok) {
			localStorage.setItem("accessToken", response.body.access_token);
		}

		return response;
	}

	async logout() {
		await this.delete("/tokens");
		localStorage.removeItem("accessToken");
	}
	
	async get(url, query, obj) {
		return this.request({method: "GET", url, query, ...obj});
	}
	
	async post(url, body, obj) {
		return this.request({method: "POST", url, body, ...obj});
	}
	
	async put(url, body, obj) {
		return this.request({method: "PUT", url, body, ...obj});
	}
	
	async delete(url, obj) {
		return this.request({method: "DELETE", url, ...obj});
	}
}