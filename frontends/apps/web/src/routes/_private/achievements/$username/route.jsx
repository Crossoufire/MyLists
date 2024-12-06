import {achievementOptions} from "@mylists/api/src/queryOptions";
import {createFileRoute, redirect} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/achievements/$username")({
    loader: async ({ context: { queryClient }, params: { username } }) => {
        try {
            await queryClient.ensureQueryData(achievementOptions(username));
        }
        catch (error) {
            if (error.status === 403) {
                throw redirect({
                    to: "/",
                    search: { message: "You need to be logged-in to view the achievements" },
                });
            }
        }
    },
});
