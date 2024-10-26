import {followsOptions} from "@/api/queryOptions";
import {createFileRoute} from "@tanstack/react-router";


export const Route = createFileRoute("/_private/profile/$username/_header/follows")({
    loader: ({context: {queryClient}, params: {username}}) => {
        return queryClient.ensureQueryData(followsOptions(username));
    },
});
