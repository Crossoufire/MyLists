import {achievementOptions} from "@/api/queryOptions";
import {createFileRoute, redirect} from "@tanstack/react-router";


export const Route = createFileRoute("/_private/achievements/$username")({
    loader: async ({context: {queryClient}, params: {username}}) => {
        try {
            await queryClient.ensureQueryData(achievementOptions(username));
        }
        catch (error) {
            if (error.status === 403) {
                throw redirect({
                    to: "/",
                    search: {message: "You need to be logged-in to view the achievements"},
                });
            }
        }
    },
});
