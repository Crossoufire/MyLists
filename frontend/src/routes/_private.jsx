import {api, userClient} from "@/api/MyApiClient";
import {createFileRoute, redirect} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures,JSUnusedGlobalSymbols
export const Route = createFileRoute("/_private")({
    beforeLoad: async () => {
        if (!userClient.wasInitialized) {
            await userClient.initialize();
        }
        if (!userClient.currentUser || !api.isAuthenticated()) {
            userClient.setCurrentUser(null);
            return redirect({ to: "/" });
        }
    },
});
