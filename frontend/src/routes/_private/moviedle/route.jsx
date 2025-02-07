import {dailyMediadleOptions} from "@/api";
import {createFileRoute} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/moviedle")({
    loader: async ({ context: { queryClient } }) => queryClient.ensureQueryData(dailyMediadleOptions()),
});
