import {CurrentUser} from "@/lib/server/types/base.types";
import {createFileRoute, redirect} from "@tanstack/react-router";
import {queryKeys} from "@/lib/react-query/query-options/query-options";


export const Route = createFileRoute("/_public")({
    validateSearch: ({ search }) => search as { authExpired?: boolean },
    beforeLoad: async ({ context: { queryClient }, search }) => {
        const currentUser: CurrentUser = queryClient.getQueryData(queryKeys.authKey());

        if (search.authExpired) {
            await queryClient.invalidateQueries({ queryKey: queryKeys.authKey() });
            queryClient.clear();
            throw redirect({ to: "/", replace: true });
        }

        if (currentUser) {
            throw redirect({ to: "/profile/$username", params: { username: currentUser.name }, replace: true });
        }
    },
});
