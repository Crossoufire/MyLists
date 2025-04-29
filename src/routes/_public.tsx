import {queryKeys} from "@/lib/react-query/query-options/query-options";
import {CurrentUser} from "@/lib/server/types/base.types";
import {createFileRoute, redirect} from "@tanstack/react-router";


export const Route = createFileRoute("/_public")({
    beforeLoad: ({ context: { queryClient } }) => {
        const currentUser = queryClient.getQueryData(queryKeys.authKey()) as CurrentUser;

        if (currentUser) {
            throw redirect({ to: "/profile/$username", params: { username: currentUser.name } });
        }
    },
});
