import {api} from "@/api/apiClient";
import {createFileRoute, redirect} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures,JSUnusedGlobalSymbols
export const Route = createFileRoute("/_private")({
    beforeLoad: ({ context: { auth } }) => {
        if (!auth.currentUser || !api.isAuthenticated()) {
            throw redirect({ to: "/" });
        }
    },
});
