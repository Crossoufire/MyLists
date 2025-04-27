import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {ApiProviderType} from "@/lib/server/utils/enums";
import {authMiddleware} from "@/lib/server/middlewares/authentication";


export const getSearchResults = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator((data: any): { query: string, page: number, apiProvider: ApiProviderType } => data)
    .handler(async ({ data: { query, page, apiProvider } }) => {
        const tmdbClient = getContainer().clients.tmdb;
        const userService = getContainer().services.user;
        const tmdbTransformer = getContainer().transformers.tmdb;

        if (apiProvider === ApiProviderType.USERS) {
            return userService.searchUsers(query, page);
        }

        if (apiProvider === ApiProviderType.TMDB) {
            const rawResults = await tmdbClient.search(query, page);
            return tmdbTransformer.transformSearchResults(rawResults);
        }
    });
