import {getApiClient} from "@/api";
import {createFileRoute, redirect} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private")({
    beforeLoad: ({ context: { auth }, location }) => {
        const routeType = ["/profile", "/stats", "/list", "/achievements"].some(path => location.pathname.startsWith(path))
            ? location.pathname.split("/")[1] : "other";

        if (routeType === "other" && (!auth.currentUser || !getApiClient().isAuthenticated())) {
            throw redirect({ to: "/", search: { message: "You need to be logged-in to view this page" } });
        }
    },
});
