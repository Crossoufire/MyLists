import {api} from "@/api/apiClient";
import {createFileRoute, redirect} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures,JSUnusedGlobalSymbols
export const Route = createFileRoute("/_private")({
    beforeLoad: ({ context: { auth }, location }) => {
        // Do not redirect if user is not logged-in if trying to access profile/list/stats page
        if (["/profile", "/stats", "/list"].some(path => location.pathname.startsWith(path))) {
            return;
        }

        if (!auth.currentUser || !api.isAuthenticated()) {
            throw redirect({ to: "/" });
        }
    },
});
