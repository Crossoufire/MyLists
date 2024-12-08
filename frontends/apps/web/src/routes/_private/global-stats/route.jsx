import {globalStatsOptions} from "@mylists/api/src/queryOptions";
import {createFileRoute} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/global-stats")({
    loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(globalStatsOptions()),
});