import {allUpdatesOptions} from "@/api";
import {createFileRoute} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/profile/$username/_header/history")({
    loaderDeps: ({ search }) => ({ search }),
    loader: ({ context: { queryClient }, params: { username }, deps }) => {
        return queryClient.ensureQueryData(allUpdatesOptions(username, deps.search));
    },
});
