import {hallOfFameOptions} from "@/api/queryOptions";
import {createFileRoute} from "@tanstack/react-router";


export const Route = createFileRoute("/_private/hall-of-fame")({
    loaderDeps: ({ search }) => ({ search }),
    loader: ({ context: { queryClient }, deps: { search } }) => queryClient.ensureQueryData(hallOfFameOptions(search)),
});
