import {historyOptions} from "@/api/queryOptions";
import {createFileRoute} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/profile/$username/_header/history")({
    loaderDeps: ({ search }) => ({ search }),
    loader: ({ context: { queryClient }, params: { username }, deps }) => {
        return queryClient.ensureQueryData(historyOptions(username, deps.search));
    },
});
