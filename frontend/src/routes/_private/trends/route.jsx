import {trendsOptions} from "@/api";
import {createFileRoute} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/trends")({
    loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(trendsOptions()),
});
