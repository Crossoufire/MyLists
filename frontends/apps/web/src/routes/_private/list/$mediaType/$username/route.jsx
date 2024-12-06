import {listOptions} from "@mylists/api/src/queryOptions";
import {createFileRoute, redirect} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/list/$mediaType/$username")({
    loaderDeps: ({ search }) => ({ search }),
    loader: async ({ context: { queryClient }, params: { mediaType, username }, deps: { search } }) => {
        try {
            await queryClient.ensureQueryData(listOptions(mediaType, username, search));
        }
        catch (error) {
            if (error.status === 403) {
                throw redirect({
                    to: "/",
                    search: { message: "You need to be logged-in to view this collection" },
                });
            }
        }
    },
});
