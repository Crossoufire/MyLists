import {queryKeys} from "@/lib/react-query/query-options";
import {CurrentUser} from "@/lib/server/types/base.types";
import {createFileRoute, redirect} from "@tanstack/react-router";


export const Route = createFileRoute("/_private")({
    beforeLoad: ({ context: { queryClient }, location }) => {
        const routeType = ["/profile", "/stats", "/list", "/achievements"]
            .some(path => location.pathname.startsWith(path)) ? location.pathname.split("/")[1] : "other";

        const currentUser = queryClient.getQueryData(queryKeys.authKey()) as CurrentUser;

        if (routeType === "other" && !currentUser) {
            throw redirect({ to: "/" });
        }
    },
});
