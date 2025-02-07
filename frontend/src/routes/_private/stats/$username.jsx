import {statsOptions} from "@/api";
import {createFileRoute, redirect} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/stats/$username")({
    loaderDeps: ({ search }) => ({ search }),
    loader: async ({ context: { queryClient }, params: { username }, deps: { search } }) => {
        try {
            await queryClient.ensureQueryData(statsOptions(username, search));
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
