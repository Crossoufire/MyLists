import {editMediaOptions} from "@/api";
import {createFileRoute} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/details/edit/$mediaType/$mediaId")({
    loader: ({ context: { queryClient }, params: { mediaType, mediaId } }) => {
        return queryClient.ensureQueryData(editMediaOptions(mediaType, mediaId));
    },
});
