import {statsOptions} from "@mylists/api/src";
import {createFileRoute, redirect} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/stats/$mediaType/$username")({
    loader: async ({ context: { queryClient }, params: { mediaType, username } }) => {
        try {
            await queryClient.ensureQueryData(statsOptions(mediaType, username));
        }
        catch (error) {
            if (error.status === 403) {
                throw redirect({
                    to: "/",
                    search: { message: "You need to be logged-in to view these stats" },
                });
            }
        }
    },
});
