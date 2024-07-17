import {userClient} from "@/api/MyApiClient";
import {createFileRoute, redirect} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures,JSUnusedGlobalSymbols
export const Route = createFileRoute("/_public")({
    beforeLoad: async () => {
        if (!userClient.wasInitialized) {
            await userClient.initialize();
        }
        if (userClient.currentUser) {
            return redirect({ to: `/profile/${userClient.currentUser.username}` });
        }
    },
});
