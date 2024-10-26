import {allUpdatesOptions} from "@/api/queryOptions";
import {createFileRoute} from "@tanstack/react-router";


export const Route = createFileRoute("/_private/profile/$username/_header/history")({
    loaderDeps: ({search}) => ({search}),
    loader: ({context: {queryClient}, params: {username}, deps}) => {
        return queryClient.ensureQueryData(allUpdatesOptions(username, deps.search));
    },
});
