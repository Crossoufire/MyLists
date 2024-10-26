import {upcomingOptions} from "@/api/queryOptions";
import {createFileRoute} from "@tanstack/react-router";


export const Route = createFileRoute("/_private/coming-next")({
    loader: ({context: {queryClient}}) => queryClient.ensureQueryData(upcomingOptions()),
});
