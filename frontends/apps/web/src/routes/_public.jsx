import {getApiClient} from "@mylists/api";
import {createFileRoute, redirect} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures,JSUnusedGlobalSymbols
export const Route = createFileRoute("/_public")({
    beforeLoad: ({ context: { auth } }) => {
        if (auth.currentUser && getApiClient().isAuthenticated()) {
            throw redirect({ to: `/profile/${auth.currentUser.username}` });
        }
    },
});
