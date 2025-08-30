import {createFileRoute, redirect} from "@tanstack/react-router";
import {queryKeys} from "@/lib/react-query/query-options/query-options";
import {CurrentUser} from "@/lib/types/query.options.types";


export const Route = createFileRoute("/_private")({
    beforeLoad: ({ context: { queryClient }, location }) => {
        const routeType = ["/profile", "/stats", "/list", "/achievements"]
            .some((path) => location.pathname.startsWith(path)) ? "semi-private" : "full-private";

        const currentUser = queryClient.getQueryData<CurrentUser>(queryKeys.authKey());

        if (routeType === "full-private" && !currentUser) {
            throw redirect({ to: "/" });
        }
    },
});
