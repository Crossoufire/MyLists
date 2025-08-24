import {RoleType} from "@/lib/server/utils/enums";
import {CurrentUser} from "@/lib/server/types/base.types";
import {createFileRoute, notFound} from "@tanstack/react-router";
import {queryKeys} from "@/lib/react-query/query-options/query-options";


export const Route = createFileRoute("/_admin")({
    beforeLoad: ({ context: { queryClient } }) => {
        const currentUser: CurrentUser = queryClient.getQueryData(queryKeys.authKey());

        if (!currentUser || currentUser.role !== RoleType.MANAGER) {
            throw notFound();
        }
    },
});
