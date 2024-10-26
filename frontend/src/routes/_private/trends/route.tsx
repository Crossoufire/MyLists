import {trendsOptions} from "@/api/queryOptions";
import {createFileRoute} from "@tanstack/react-router";


export const Route = createFileRoute("/_private/trends")({
    loader: ({context: {queryClient}}) => queryClient.ensureQueryData(trendsOptions()),
});
