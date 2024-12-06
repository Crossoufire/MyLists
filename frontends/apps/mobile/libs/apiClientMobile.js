import {ApiClient} from "@mylists/api/src";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";


export class ApiClientMobile extends ApiClient {
    async setAccessToken(token) {
        await AsyncStorage.setItem("access_token", token);
    }

    async getAccessToken() {
        return await AsyncStorage.getItem("access_token");
    }

    async removeAccessToken() {
        await AsyncStorage.removeItem("access_token");
    }

    async setRefreshToken(value) {
        await SecureStore.setItemAsync("refresh_token", value);
    }

    async getRefreshToken() {
        return await SecureStore.getItemAsync("refresh_token");
    }

    includeCredentials() {
        return false;
    }
}
