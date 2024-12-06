import {ApiClient} from "@mylists/api/src";


export class ApiClientWeb extends ApiClient {
    setAccessToken(token) {
        localStorage.setItem("accessToken", token);
    }

    getAccessToken() {
        return localStorage.getItem("accessToken");
    }

    removeAccessToken() {
        localStorage.removeItem("accessToken");
    }
}
