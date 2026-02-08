import {createFileRoute, redirect} from "@tanstack/react-router";
import {authOptions} from "@/lib/client/react-query/query-options/query-options";


export const Route = createFileRoute("/_main/_public")({
    validateSearch: ({ search }) => search as { authExpired?: boolean },
    beforeLoad: async ({ context: { queryClient }, search }) => {
        const currentUser = queryClient.getQueryData(authOptions.queryKey);

        if (search.authExpired) {
            await queryClient.invalidateQueries({ queryKey: authOptions.queryKey });
            queryClient.clear();
            throw redirect({ to: "/", replace: true });
        }

        if (currentUser) {
            throw redirect({ to: "/profile/$username", params: { username: currentUser.name }, replace: true });
        }
    },
});
