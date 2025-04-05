import {createFileRoute, redirect} from "@tanstack/react-router";
import {authOptions, queryKeys} from "@/lib/react-query/query-options";


type CurrentUser = ReturnType<typeof authOptions>["queryFn"];

export const Route = createFileRoute("/_public")({
    beforeLoad: ({ context: { queryClient } }) => {
        const currentUser = queryClient.getQueryData(queryKeys.authKey()) as CurrentUser;
        if (currentUser) {
            throw redirect({ to: "/profile/$username", params: { username: currentUser.name } });
        }
    },
    ssr: false,
});
