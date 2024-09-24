import {statsOptions} from "@/api/queryOptions";
import {createFileRoute, redirect} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/stats/$mediaType/$username")({
    loader: async ({ context: { auth, queryClient }, params: { mediaType, username } }) => {
        const apiData = await queryClient.ensureQueryData(statsOptions(mediaType, username));

        // Not allowed to view non-public profile if user not logged in
        if (!auth.currentUser && apiData.user_data?.privacy !== "public") {
            throw redirect({
                to: "/",
                search: { message: "You need to be logged in to view this stats page." },
            });
        }
    },
});
