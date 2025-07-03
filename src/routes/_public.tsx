import {CurrentUser} from "@/lib/server/types/base.types";
import {createFileRoute, redirect} from "@tanstack/react-router";
import {queryKeys} from "@/lib/react-query/query-options/query-options";


export const Route = createFileRoute("/_public")({
    beforeLoad: ({ context: { queryClient } }) => {
        const currentUser: CurrentUser = queryClient.getQueryData(queryKeys.authKey());

        console.log({ currentUser })

        if (currentUser) {
            throw redirect({ to: "/profile/$username", params: { username: currentUser.name } });
        }
    },
});
