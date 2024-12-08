import {createFileRoute} from "@tanstack/react-router";
import {dailyMediadleOptions} from "@mylists/api/src/queryOptions";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/moviedle")({
    loader: async ({ context: { queryClient } }) => queryClient.ensureQueryData(dailyMediadleOptions()),
});
