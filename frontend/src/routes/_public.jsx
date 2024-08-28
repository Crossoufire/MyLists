import {api} from "@/api/MyApiClient";
import {createFileRoute, redirect} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures,JSUnusedGlobalSymbols
export const Route = createFileRoute("/_public")({
    beforeLoad: ({ context }) => {
        if (context.auth.currentUser && api.isAuthenticated()) {
            throw redirect({ to: `/profile/${context.auth.currentUser.username}` });
        }
    },
});
