import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {ApiProviderType} from "@/lib/server/utils/enums";
import {navbarSearchSchema} from "@/lib/server/types/base.types";
import {authMiddleware} from "@/lib/server/middlewares/authentication";


export const getSearchResults = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator(navbarSearchSchema)
    .handler(async ({ data: { query, page, apiProvider } }) => {
        const container = await getContainer();
        const igdbClient = container.clients.igdb;
        const tmdbClient = container.clients.tmdb;
        const gBookClient = container.clients.gBook;
        const userService = container.services.user;
        const igdbTransformer = container.transformers.igdb;
        const tmdbTransformer = container.transformers.tmdb;
        const gBookTransformer = container.transformers.gBook;

        if (apiProvider === ApiProviderType.USERS) {
            return userService.searchUsers(query, page);
        }

        if (apiProvider === ApiProviderType.TMDB) {
            const rawResults = await tmdbClient.search(query, page);
            return tmdbTransformer.transformSearchResults(rawResults);
        }

        if (apiProvider === ApiProviderType.IGDB) {
            const rawResults = await igdbClient.search(query, page);
            return igdbTransformer.transformSearchResults(rawResults);
        }

        if (apiProvider === ApiProviderType.BOOKS) {
            const rawResults = await gBookClient.search(query, page);
            return gBookTransformer.transformSearchResults(rawResults);
        }
    });
