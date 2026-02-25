import {ApiProviderType} from "@/lib/utils/enums";
import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {navbarSearchSchema} from "@/lib/types/zod.schema.types";
import {requiredAuthMiddleware} from "@/lib/server/middlewares/authentication";
import {tmdbTransformer} from "@/lib/server/api-providers/transformers/tmdb.transformer";
import {igdbTransformer} from "@/lib/server/api-providers/transformers/igdb.transformer";
import {jikanTransformer} from "@/lib/server/api-providers/transformers/jikan.transformer";
import {gbooksTransformer} from "@/lib/server/api-providers/transformers/gbook.transformer";


export const getSearchResults = createServerFn({ method: "GET" })
    .middleware([requiredAuthMiddleware])
    .inputValidator(navbarSearchSchema)
    .handler(async ({ data: { query, page, apiProvider } }) => {
        const container = await getContainer();
        const igdbClient = container.clients.igdb;
        const tmdbClient = container.clients.tmdb;
        const gBookClient = container.clients.gBook;
        const jikanClient = container.clients.jikan;
        const userService = container.services.user;

        if (query === "") {
            return { hasNextPage: false, data: [] };
        }

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
            return gbooksTransformer.transformSearchResults(rawResults);
        }
        else {
            const rawResults = await jikanClient.search(query, page);
            return jikanTransformer.transformSearchResults(rawResults);
        }
    });
