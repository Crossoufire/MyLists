import {listOptions} from "@/api/queryOptions";
import {createFileRoute, redirect} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/list/$mediaType/$username")({
    loaderDeps: ({ search }) => ({ search }),
    loader: async ({ context: { auth, queryClient }, params: { mediaType, username }, deps: { search } }) => {
        const apiData = await queryClient.ensureQueryData(listOptions(mediaType, username, search));

        // Not allowed to view non-public profile if user not logged in
        if (!auth.currentUser && apiData.user_data?.privacy !== "public") {
            throw redirect({
                to: "/",
                search: { message: "You need to be logged in to view this collection page" },
            });
        }
    },
});
