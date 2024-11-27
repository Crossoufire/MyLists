import {detailsOptions, queryKeys} from "@/api/queryOptions";
import {createFileRoute, redirect} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/details/$mediaType/$mediaId")({
    loaderDeps: ({ search }) => ({ search }),
    loader: async ({ context: { queryClient }, params: { mediaType, mediaId }, deps: { search } }) => {
        if (!search.external) {
            const cacheData = queryClient.getQueryData(queryKeys.detailsKey(mediaType, mediaId.toString()));
            if (cacheData) return cacheData;
        }
        const data = await queryClient.ensureQueryData(detailsOptions(mediaType, mediaId, search.external));
        queryClient.setQueryData(queryKeys.detailsKey(mediaType, data.media.id.toString()), data);
        if (search.external) {
            throw redirect({ to: `/details/${mediaType}/${data.media.id}`, replace: true });
        }
        return data;
    },
});
