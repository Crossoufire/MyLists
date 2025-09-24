import {RoleType} from "@/lib/server/utils/enums";
import {createFileRoute, notFound} from "@tanstack/react-router";
import {authOptions} from "@/lib/react-query/query-options/query-options";


export const Route = createFileRoute("/_admin")({
    beforeLoad: ({ context: { queryClient } }) => {
        const currentUser = queryClient.getQueryData(authOptions.queryKey);

        if (!currentUser || currentUser.role !== RoleType.MANAGER) {
            throw notFound();
        }
    },
});
