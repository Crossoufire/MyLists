import {createFileRoute} from "@tanstack/react-router";


export const Route = createFileRoute("/_admin")({
    beforeLoad: ({ context: { queryClient } }) => {
    },
});
