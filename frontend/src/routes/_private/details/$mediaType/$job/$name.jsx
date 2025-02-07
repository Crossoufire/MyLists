import {jobDetailsOptions} from "@/api";
import {createFileRoute} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/details/$mediaType/$job/$name")({
    loader: ({ context: { queryClient }, params: { mediaType, job, name } }) => {
        return queryClient.ensureQueryData(jobDetailsOptions(mediaType, job, name));
    },
});
