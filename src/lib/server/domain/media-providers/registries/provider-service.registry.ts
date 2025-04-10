import {ApiProviderType} from "@/lib/server/utils/enums";
import {ISearchProvider} from "@/lib/server/domain/media-providers/interfaces/media-provider.interface";


export class ProviderServiceRegistry {
    private static services: Partial<Record<ApiProviderType, ISearchProvider>> = {};

    static registerService(name: ApiProviderType, service: ISearchProvider) {
        this.services[name] = service;
    }

    static getService(name: ApiProviderType) {
        if (!this.services[name]) {
            throw new Error(`Provider service ${name} not registered`);
        }
        return this.services[name];
    }
}
