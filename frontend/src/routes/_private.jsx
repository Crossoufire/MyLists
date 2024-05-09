import {userClient} from "@/api/MyApiClient";
import {createFileRoute, redirect} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures,JSUnusedGlobalSymbols
export const Route = createFileRoute("/_private")({
    beforeLoad: () => {
        if (!userClient.currentUser) {
            return redirect({ to: "/" });
        }
    },
});
