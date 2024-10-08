import {followersOptions} from "@/api/queryOptions";
import {createFileRoute} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/profile/$username/_header/followers")({
    loader: ({ context: { queryClient }, params: { username } }) => {
        return queryClient.ensureQueryData(followersOptions(username));
    },
});
