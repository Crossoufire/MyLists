import {createFileRoute, redirect} from "@tanstack/react-router";
import {authOptions} from "@/lib/react-query/query-options/query-options";


export const Route = createFileRoute("/_main/_private")({
    beforeLoad: ({ context: { queryClient }, location }) => {
        const routeType = ["/profile", "/stats", "/list", "/achievements"]
            .some((path) => location.pathname.startsWith(path)) ? "semi-private" : "full-private";

        const currentUser = queryClient.getQueryData(authOptions.queryKey);

        if (routeType === "full-private" && !currentUser) {
            throw redirect({ to: "/" });
        }
    },
});
