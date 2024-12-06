import {upcomingOptions} from "@mylists/api/src/queryOptions";
import {createFileRoute} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/coming-next")({
    loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(upcomingOptions()),
});
