import {RoleType} from "@/lib/server/utils/enums";
import {createFileRoute, notFound} from "@tanstack/react-router";
import {queryKeys} from "@/lib/react-query/query-options/query-options";
import {CurrentUser} from "@/lib/types/query.options.types";


export const Route = createFileRoute("/_admin")({
    beforeLoad: ({ context: { queryClient } }) => {
        const currentUser: CurrentUser = queryClient.getQueryData(queryKeys.authKey());

        if (!currentUser || currentUser.role !== RoleType.MANAGER) {
            throw notFound();
        }
    },
});
