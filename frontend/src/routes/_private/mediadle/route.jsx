import {dailyGameOptions} from "@/api/queryOptions";
import {createFileRoute} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/mediadle")({
    loader: async ({ context: { queryClient } }) => queryClient.ensureQueryData(dailyGameOptions()),
});
