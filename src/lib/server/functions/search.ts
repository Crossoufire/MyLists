import {container} from "@/lib/server/container";
import {createServerFn} from "@tanstack/react-start";
import {ApiProviderType} from "@/lib/server/utils/enums";
import {authMiddleware} from "@/lib/server/middlewares/authentication";


export const getSearchResults = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator((data: any): { query: string, page: number, apiProvider: ApiProviderType } => data)
    .handler(async ({ data: { query, page, apiProvider } }) => {
        const tmdbClient = container.clients.tmdb;
        const userService = container.services.user;
        const tmdbTransformer = container.transformers.tmdb;
        const providerRegistry = container.registries.provider;

        if (apiProvider === ApiProviderType.USERS) {
            return userService.searchUsers(query, page);
        }

        if (apiProvider === ApiProviderType.TMDB) {
            const rawResults = await tmdbClient.search(query, page);
            return tmdbTransformer.transformSearchResults(rawResults);
        }

        const providerService = providerRegistry.getService(apiProvider);
        return providerService.search(query, page);
    });
